import json
import os
import random
import re
import requests
from dotenv import load_dotenv

load_dotenv()

# ---- Provider 1: Z.ai (OpenAI-compatible, needs API key, best quality) ----
API_KEY = os.getenv("ZAI_API_KEY", "").strip()
API_BASE = os.getenv("ZAI_API_BASE", "https://api.z.ai/v1").strip().rstrip("/")
MODEL = os.getenv("ZAI_MODEL", "glm-4.5-turbo").strip()

# ---- Provider 2: local Ollama (free, no API key, runs on this PC) ----
# Small models are fast but sloppy; parsing below tolerates their output.
# Raise OLLAMA_TIMEOUT if you switch to a bigger model (e.g. qwen2.5:7b).
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b").strip()
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120").strip())

GENERATION_TIMEOUT = 45  # seconds (cloud provider)
HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(HERE, "fallback_questions.json"), encoding="utf-8") as f:
    FALLBACK_BANK = json.load(f)

SYSTEM_PROMPT = (
    "You are a trivia question generator. You always reply with valid JSON only, "
    "no markdown fences, no commentary."
)

_LETTER_RE = re.compile(r"^\(?([a-dA-D])\)?[\.\):]?[\s\.]*$")
_OPTION_PREFIX_RE = re.compile(r"^\(?[a-dA-D]\)?[\.\):]\s+")


def _user_prompt(topic, count):
    return (
        f"Generate {count} multiple-choice trivia questions about \"{topic}\". "
        "Reply with a JSON array only. Each item must look exactly like: "
        '{"question": "...", "options": ["..", "..", "..", ".."], '
        '"answer": "the correct option text, copied exactly"}. '
        "Do NOT write answers as letters like 'a'; write the full option text. "
        "Make the questions distinct, factual and fun; keep wording short. "
        "Do NOT wrap the array in quotes."
    )


def _chat(base_url, api_key, model, message, max_tokens, timeout):
    """Shared OpenAI-compatible /chat/completions call (Z.ai and Ollama)."""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
        "temperature": 0.8,
        "max_tokens": max_tokens,
    }
    resp = requests.post(
        f"{base_url}/chat/completions", headers=headers, json=payload, timeout=timeout
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _extract_json_objects(text):
    """Tolerant parsing: fenced JSON, array, or line-delimited objects (small LLMs)."""
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    # 1) straightforward parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            return parsed.get("questions", [])
        if isinstance(parsed, str):  # model double-encoded the JSON as a string
            return _extract_json_objects(parsed)
    except json.JSONDecodeError:
        pass
    # 2) try to cut out a JSON array
    match = re.search(r"\[.*\]", text, flags=re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
    # 3) line-delimited / relaxed output: one object per line
    objects = []
    for line in text.splitlines():
        line = line.strip().strip(",")
        if line.startswith("{"):
            try:
                objects.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return objects


def _clean_option(raw):
    """Options like 'a) Oxygen' -> 'Oxygen' (small models love letter prefixes)."""
    return str(raw).strip().strip('"').strip()


def _fingerprint(option):
    """Loose form used to drop near-duplicates ('Alfa Centauri' vs 'Alpha Centauri')."""
    return re.sub(r"[^a-z0-9]", "", option.lower())


def _resolve_answer(answer, options):
    """Accept full option text, a bare letter ('a'), or 'a) Oxygen' style."""
    a = str(answer).strip()
    m = _LETTER_RE.match(a)
    if m:  # letter answer -> position in the *original* order is unknown when
        return None  # options were shuffled, handled by caller via original order
    cleaned = _clean_option(a)
    for opt in options:
        if opt.lower() == cleaned.lower():
            return opt
        # 'a) Oxygen' answer vs cleaned options
        opt_stripped = _OPTION_PREFIX_RE.sub("", opt)
        if opt_stripped.lower() == cleaned.lower():
            return opt_stripped
    return None


def _validate(raw_questions, count):
    """Normalize/validate LLM output into our question shape, then shuffle options."""
    questions = []
    for q in raw_questions:
        try:
            text = str(q["question"]).strip()
            if not text:
                continue
            raw_options = q["options"]
            if isinstance(raw_options, str):  # model sent options as a string
                try:
                    raw_options = json.loads(raw_options)
                except json.JSONDecodeError:
                    try:
                        import ast
                        raw_options = ast.literal_eval(raw_options)
                    except (ValueError, SyntaxError):
                        continue
            options = [_clean_option(o) for o in raw_options]
            # strip letter prefixes like 'a) '
            options = [_OPTION_PREFIX_RE.sub("", o).strip() for o in options]
            # exact AND near-duplicate check (small models emit spelling variants)
            keyed = {}
            for opt in options:  # keep first spelling of each loose duplicate
                keyed.setdefault(_fingerprint(opt), opt)
            if len(options) != 4 or len(keyed) != 4:
                continue
            options = list(keyed.values())
            answer = _resolve_answer(q.get("answer", ""), options)
            if answer is None:
                # letter answer: use its position; only safe if options were not shuffled
                m = _LETTER_RE.match(str(q.get("answer", "").strip()))
                if m and str(q.get("answer", "")).strip() == m.group(0):
                    idx = ord(m.group(1).lower()) - ord("a")
                    if 0 <= idx < 4:
                        answer = options[idx]
            if answer is None or answer not in options:
                continue
            # shuffle so a lazy model can't always put the right answer first
            opts = list(options)
            random.shuffle(opts)
            questions.append({"question": text, "options": opts, "answer": answer})
        except (KeyError, TypeError):
            continue
    return questions[:count]


def _generate_fallback(topic, count):
    """Serve questions from the offline bank (bank-topic questions + general)."""
    pool = list(FALLBACK_BANK.get("general", [])) + list(
        FALLBACK_BANK.get(topic.lower(), [])
    )
    if len(pool) < count:
        pool = list(FALLBACK_BANK.get("general", [])) * 2
    random.shuffle(pool)
    return _validate(pool, count)


def _try_provider(base_url, api_key, model, topic, count, timeout, max_tokens):
    parsed = _chat(base_url, api_key, model, _user_prompt(topic, count), max_tokens, timeout)
    return _validate(_extract_json_objects(parsed), count)


def _user_prompt_batch(subjects, per_subject):
    topic_list = ", ".join(f'"{s}"' for s in subjects)
    return (
        f"Generate multiple-choice trivia questions for a quiz. For EACH of these "
        f"topics: {topic_list}, generate exactly {per_subject} questions about that "
        f"topic (total {per_subject * len(subjects)} questions). Reply with a JSON "
        "array only. Each item must look exactly like: "
        '{"topic": "the topic this question belongs to", "question": "...", '
        '"options": ["..", "..", "..", ".."], "answer": "the correct option '
        'text, copied exactly"}. '
        "Do NOT write answers as letters like 'a'; write the full option text. "
        "Do NOT wrap the array in quotes."
    )


def _fingerprint_topic(text):
    return re.sub(r"[^a-z0-9]", "", str(text).lower())


def _assign_by_subject(raw_objects, subjects):
    """Group validated questions under their topic; small models mislabel sometimes."""
    by_subject = {s: [] for s in subjects}
    print_debug = []
    for obj in raw_objects:
        if not isinstance(obj, dict):
            continue
        label = obj.get("topic") or obj.get("subject") or ""
        fp = _fingerprint_topic(label)
        target = next(
            (s for s in subjects if _fingerprint_topic(s) == fp or _fingerprint_topic(s) in fp or fp in _fingerprint_topic(s)),
            None,
        )
        if len(subjects) == 1:
            target = subjects[0]
        if target:
            print_debug.append((target, obj))
    return {s: [o for (t, o) in print_debug if t == s] for s in subjects}


def _generate_fallback_for_subject(topic, count, used_texts=None):
    """Top-up questions from the offline bank, skipping already-asked texts.
    Subject-specific bank questions come first, then general ones."""
    used = used_texts if used_texts is not None else set()
    specific = list(FALLBACK_BANK.get(topic.lower(), []))
    general = list(FALLBACK_BANK.get("general", []))
    random.shuffle(specific)
    random.shuffle(general)
    pool = specific + general
    out = []
    for q in pool:
        if q["question"].strip() in used:
            continue
        if q["question"].strip() not in (x["question"] for x in out):
            out.append({"question": q["question"], "options": list(q["options"]), "answer": q["answer"]})
        if len(out) >= count:
            break
    return _validate(out, count)


def generate_questions_batch(subjects, per_subject):
    """Generate questions for several subjects at once (2 per subject for the
    subject chooser flow). Single LLM call; per-subject fallback top-up."""
    subjects = [str(s)[:30].strip() for s in subjects if str(s).strip()][:6] or ["general"]
    per_subject = max(1, min(per_subject, 10))

    provider_attempts = []
    if API_KEY:
        provider_attempts.append(
            ("ai", API_BASE, API_KEY, MODEL, GENERATION_TIMEOUT, 220 * per_subject * len(subjects) + 200)
        )
    provider_attempts.append(
        ("local-ai", f"{OLLAMA_BASE}/v1", "", OLLAMA_MODEL, OLLAMA_TIMEOUT, 400 * per_subject * len(subjects))
    )

    for source_name, base, key, model, timeout, max_tokens in provider_attempts:
        try:
            parsed = _chat(base, key, model, _user_prompt_batch(subjects, per_subject), max_tokens, timeout)
            raw_objects = _extract_json_objects(parsed)
            grouped = _assign_by_subject(raw_objects, subjects)
            questions = []
            used_texts = set()
            any_ai = False
            for subj in subjects:
                valid = _validate(grouped.get(subj, []), len(grouped.get(subj, [])))
                for q in valid[:per_subject]:
                    if q["question"].strip() in used_texts:
                        continue
                    used_texts.add(q["question"].strip())
                    questions.append({**q, "subject": subj})
                    any_ai = True
                if len([q for q in questions if q["subject"] == subj]) < per_subject:
                    need = per_subject - len([q for q in questions if q["subject"] == subj])
                    for q in _generate_fallback_for_subject(subj, need, used_texts):
                        used_texts.add(q["question"].strip())
                        questions.append({**q, "subject": subj})
            if questions and any_ai:
                return {"source": source_name, "questions": questions, "model": model}
            if questions:  # everything came from fallback top-up
                print(f"[llm] {source_name} returned no valid questions; used bank")
                return {"source": "fallback", "questions": questions}
        except Exception as exc:
            print(f"[llm] batch generation via {source_name} failed ({exc})")

    # pure offline
    questions = []
    for subj in subjects:
        for q in _generate_fallback_for_subject(subj, per_subject, {q["question"] for q in questions}):
            questions.append({**q, "subject": subj})
    return {"source": "fallback", "questions": questions}


def generate_questions(topic, count):
    """Single-topic generation: Z.ai key -> local Ollama -> offline bank."""
    # 1) Z.ai (cloud, API key)
    if API_KEY:
        try:
            questions = _try_provider(
                API_BASE, API_KEY, MODEL, topic, count, GENERATION_TIMEOUT, 200 * count + 200
            )
            if questions:
                return {"source": "ai", "questions": questions}
        except Exception as exc:
            print(f"[llm] Z.ai generation failed ({exc}); trying Ollama / fallback")

    # 2) Local Ollama — free, no API key, no internet
    try:
        questions = _try_provider(
            f"{OLLAMA_BASE}/v1", "", OLLAMA_MODEL, topic, count, OLLAMA_TIMEOUT, 300 * count
        )
        if questions:
            return {"source": "local-ai", "questions": questions, "model": OLLAMA_MODEL}
        print("[llm] Ollama returned no valid questions; using fallback bank")
    except Exception as exc:
        print(f"[llm] Ollama generation failed ({exc}); using fallback bank")

    # 3) Offline bank
    return {"source": "fallback", "questions": _generate_fallback(topic, count)}
