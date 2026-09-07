import random
import re


def extract_memory_facts(content: str) -> list[dict]:
    """
    Extract explicit facts from a memory.

    Supports:
    - English
    - Hindi
    - Bengali
    - Assamese
    """

    facts = []
    content_lower = content.lower()

    # -------------------------
    # Locations
    # -------------------------
    locations = [
        "Jaipur",
        "Delhi",
        "Mumbai",
        "Chennai",
        "Kolkata",
        "Bengaluru",
        "Guwahati",
        "Assam",
        "garden",
        "home",
        "school",
        "hospital",
        "park",
        "temple",
        "market",
    ]

    for location in locations:
        if location.lower() in content_lower:
            facts.append({
                "type": "location",
                "value": location,
            })

    # -------------------------
    # Relationships
    # -------------------------
    relationship_keywords = {
        "daughter": [
            "daughter",
            "बेटी",
            "बेटी की",
            "জীয়েক",
            "মেয়ে",
            "মেয়",
        ],
        "son": [
            "son",
            "बेटा",
            "बेटे",
            "পুত্ৰ",
            "ছেলে",
        ],
        "mother": [
            "mother",
            "माँ",
            "मां",
            "মাক",
            "মা",
        ],
        "father": [
            "father",
            "पिता",
            "पापा",
            "দেউতা",
            "বাবা",
        ],
        "brother": [
            "brother",
            "भाई",
            "ভাই",
        ],
        "sister": [
            "sister",
            "बहन",
            "ভনী",
            "বোন",
        ],
        "friend": [
            "friend",
            "दोस्त",
            "বন্ধু",
        ],
        "wife": [
            "wife",
            "पत्नी",
            "স্ত্ৰী",
            "স্ত্রী",
        ],
        "husband": [
            "husband",
            "पति",
            "স্বামী",
        ],
        "grandmother": [
            "grandmother",
            "दादी",
            "नानी",
            "আইতা",
            "দিদা",
        ],
        "grandfather": [
            "grandfather",
            "दादा",
            "नाना",
            "ককা",
            "দাদু",
        ],
    }

    for relationship, keywords in relationship_keywords.items():
        if any(keyword.lower() in content_lower for keyword in keywords):
            facts.append({
                "type": "relationship",
                "value": relationship,
            })

    # -------------------------
    # Events
    # -------------------------
    event_keywords = {
        "wedding": [
            "wedding",
            "शादी",
            "विवाह",
            "ब्याह",
            "বিয়া",
            "বিয়ে",
        ],
        "birthday": [
            "birthday",
            "जन्मदिन",
            "জন্মদিন",
        ],
        "festival": [
            "festival",
            "त्योहार",
            "उत्सव",
            "उৎসৱ",
        ],
        "marriage": [
            "marriage",
            "विवाह",
            "বিবাহ",
        ],
        "trip": [
            "trip",
            "यात्रा",
            "ভ্ৰমণ",
            "ভ্রমণ",
        ],
        "holiday": [
            "holiday",
            "छुट्टी",
            "ছুটি",
            "ছুটী",
        ],
    }

    for event, keywords in event_keywords.items():
        if any(keyword.lower() in content_lower for keyword in keywords):
            facts.append({
                "type": "event",
                "value": event,
            })

    # -------------------------
    # Activities
    # -------------------------
    activity_keywords = {
        "tea": [
            "tea",
            "चाय",
            "চা",
            "চাহ",
        ],
        "coffee": [
            "coffee",
            "कॉफ़ी",
            "कॉफी",
            "কফি",
        ],
        "breakfast": [
            "breakfast",
            "नाश्ता",
            "জলপান",
        ],
        "lunch": [
            "lunch",
            "दोपहर का खाना",
            "দুপৰীয়া আহাৰ",
        ],
        "dinner": [
            "dinner",
            "रात का खाना",
            "ৰাতিৰ আহাৰ",
        ],
        "walking": [
            "walking",
            "टहलना",
            "चलना",
            "খোজ কঢ়া",
            "হাঁটা",
        ],
        "reading": [
            "reading",
            "पढ़ना",
            "পঢ়া",
            "পড়া",
        ],
        "singing": [
            "singing",
            "गाना",
            "গান",
        ],
        "cooking": [
            "cooking",
            "खाना बनाना",
            "ৰন্ধা",
            "রান্না",
        ],
        "shopping": [
            "shopping",
            "खरीदारी",
            "কিনা-কটা",
            "কেনাকাটা",
        ],
    }

    for activity, keywords in activity_keywords.items():
        if any(keyword.lower() in content_lower for keyword in keywords):
            facts.append({
                "type": "activity",
                "value": activity,
            })

    # -------------------------
    # Person-name detection
    # -------------------------
    known_words = {
        word.lower()
        for word in (
            locations
            + list(relationship_keywords.keys())
            + list(event_keywords.keys())
            + list(activity_keywords.keys())
        )
    }

    common_non_person_words = {
        "a",
        "an",
        "the",
        "my",
        "our",
        "his",
        "her",
        "their",
        "this",
        "that",
        "these",
        "those",
        "i",
        "we",
        "he",
        "she",
        "they",
        "it",
        "and",
        "but",
        "with",
        "from",
        "was",
        "were",
        "is",
        "are",
        "in",
        "on",
        "at",
        "to",
        "of",
        "for",
        "family",
        "beautiful",
        "memory",
    }

    # Only use English-style capitalized words for person detection.
    # Native-script names are intentionally not guessed as people.
    words = re.findall(
        r"\b[A-Z][a-zA-Z'-]+\b",
        content
    )

    seen_people = set()

    for word in words:
        cleaned = word.strip(
            ".,!?;:'\"()[]{}"
        )

        if not cleaned:
            continue

        if len(cleaned) < 2:
            continue

        cleaned_lower = cleaned.lower()

        if cleaned_lower in known_words:
            continue

        if cleaned_lower in common_non_person_words:
            continue

        if cleaned_lower in seen_people:
            continue

        seen_people.add(cleaned_lower)

        facts.append({
            "type": "person",
            "value": cleaned,
        })

        # Fallback: never reject a non-empty memory just because
    # no structured keyword was detected.
    if not facts and content.strip():
        facts.append({
            "type": "memory",
            "value": content.strip(),
        })

    return facts

def get_question_template(
    fact_type: str,
    language: str
) -> str:
    """
    Returns translated question templates.
    Supports English, Hindi, Bengali, and Assamese.
    """

    language = language.lower()

    templates = {
        "english": {
            "location": "Which place is mentioned in this memory?",
            "relationship": "Which relationship is mentioned?",
            "event": "Which event is mentioned?",
            "activity": "What activity is mentioned?",
            "person": "Who is mentioned in this memory?",
            "default": "What do you remember from this memory?",
        },

        "hindi": {
            "location": "यह याद किस स्थान से जुड़ी है?",
            "relationship": "इस याद में कौन-सा रिश्ता बताया गया है?",
            "event": "इस याद में कौन-सा अवसर बताया गया है?",
            "activity": "इस याद में कौन-सी गतिविधि की गई है?",
            "person": "इस याद में किस व्यक्ति का नाम है?",
            "default": "आपको इस याद से क्या याद है?",
        },

        "bengali": {
            "location": "এই স্মৃতিতে কোন স্থান উল্লেখ করা হয়েছে?",
            "relationship": "এই স্মৃতিতে কোন সম্পর্কের কথা বলা হয়েছে?",
            "event": "এই স্মৃতিতে কোন ঘটনা উল্লেখ করা হয়েছে?",
            "activity": "এই স্মৃতিতে কোন কার্যকলাপ করা হয়েছে?",
            "person": "এই স্মৃতিতে কার নাম উল্লেখ আছে?",
            "default": "এই স্মৃতি থেকে আপনি কী মনে করতে পারেন?",
        },

        "assamese": {
            "location": "এই স্মৃতিত কোন ঠাই উল্লেখ কৰা হৈছে?",
            "relationship": "এই স্মৃতিত কোন সম্পৰ্ক উল্লেখ কৰা হৈছে?",
            "event": "এই স্মৃতিত কোন ঘটনা উল্লেখ কৰা হৈছে?",
            "activity": "এই স্মৃতিত কোন কাৰ্যকলাপ কৰা হৈছে?",
            "person": "এই স্মৃতিত কাৰ নাম উল্লেখ আছে?",
            "default": "এই স্মৃতিৰ পৰা আপুনি কি মনত পেলায়?",
        },
    }

    lang = templates.get(
        language,
        templates["english"]
    )

    return lang.get(
        fact_type,
        lang["default"]
    )


def get_true_false_statement(
    fact_type: str,
    value: str,
    language: str
) -> str:
    """
    Build a true/false statement from an explicit memory fact.
    """

    language = language.lower()

    statements = {
        "english": {
            "location": f"This memory is connected to {value}.",
            "relationship": f"This memory mentions the person's {value}.",
            "event": f"This memory is about a {value}.",
            "activity": f"This memory mentions {value}.",
            "person": f"The person mentioned in this memory is {value}.",
        },

        "hindi": {
            "location": f"यह याद {value} से जुड़ी है।",
            "relationship": f"इस याद में {value} का रिश्ता बताया गया है।",
            "event": f"यह याद {value} के अवसर से जुड़ी है।",
            "activity": f"इस याद में {value} गतिविधि का उल्लेख है।",
            "person": f"इस याद में {value} व्यक्ति का नाम है।",
        },

        "bengali": {
            "location": f"এই স্মৃতিটি {value}-এর সঙ্গে যুক্ত।",
            "relationship": f"এই স্মৃতিতে {value} সম্পর্কের কথা বলা হয়েছে।",
            "event": f"এই স্মৃতিটি {value} অনুষ্ঠানের সঙ্গে যুক্ত।",
            "activity": f"এই স্মৃতিতে {value} কার্যকলাপের উল্লেখ আছে।",
            "person": f"এই স্মৃতিতে {value} ব্যক্তির নাম উল্লেখ আছে।",
        },

        "assamese": {
            "location": f"এই স্মৃতিটো {value}-ৰ সৈতে জড়িত।",
            "relationship": f"এই স্মৃতিত {value} সম্পৰ্কৰ কথা কোৱা হৈছে।",
            "event": f"এই স্মৃতিটো {value} অনুষ্ঠানৰ সৈতে জড়িত।",
            "activity": f"এই স্মৃতিত {value} কাৰ্যকলাপৰ উল্লেখ আছে।",
            "person": f"এই স্মৃতিত {value} ব্যক্তিৰ নাম উল্লেখ আছে।",
        },
    }

    language_statements = statements.get(
        language,
        statements["english"]
    )

    return language_statements.get(
        fact_type,
        statements["english"]["event"]
    )


def get_false_value(
    fact_type: str,
    true_value: str
) -> str:

    alternatives = {
        "location": [
            "Delhi",
            "Mumbai",
            "Chennai",
            "Kolkata",
        ],
        "relationship": [
            "son",
            "mother",
            "father",
            "brother",
        ],
        "event": [
            "birthday",
            "festival",
            "trip",
            "holiday",
        ],
        "activity": [
            "tea",
            "coffee",
            "walking",
            "reading",
        ],
        "person": [
            "John",
            "Jane",
            "David",
            "Mary",
        ],
    }

    choices = [
        value
        for value in alternatives.get(
            fact_type,
            []
        )
        if value.lower() != true_value.lower()
    ]

    if not choices:
        return "something else"

    return random.choice(choices)


def get_fill_blank_template(
    fact_type: str,
    language: str
) -> str:

    language = language.lower()

    templates = {
        "english": {
            "location": "This memory is connected to ______.",
            "relationship": "This memory mentions the person's ______.",
            "event": "This memory is about a ______.",
            "activity": "This memory mentions ______.",
            "person": "The person mentioned in this memory is ______.",
            "default": "The important detail in this memory is ______.",
        },

        "hindi": {
            "location": "यह याद ______ से जुड़ी है।",
            "relationship": "इस याद में व्यक्ति का ______ रिश्ता बताया गया है।",
            "event": "यह याद ______ के अवसर से जुड़ी है।",
            "activity": "इस याद में ______ गतिविधि का उल्लेख है।",
            "person": "इस याद में ______ व्यक्ति का नाम है।",
            "default": "इस याद की महत्वपूर्ण बात ______ है।",
        },

        "bengali": {
            "location": "এই স্মৃতিটি ______-এর সঙ্গে যুক্ত।",
            "relationship": "এই স্মৃতিতে ব্যক্তির ______ সম্পর্কের কথা বলা হয়েছে।",
            "event": "এই স্মৃতিটি ______ অনুষ্ঠানের সঙ্গে যুক্ত।",
            "activity": "এই স্মৃতিতে ______ কার্যকলাপের উল্লেখ আছে।",
            "person": "এই স্মৃতিতে ______ ব্যক্তির নাম উল্লেখ আছে।",
            "default": "এই স্মৃতির গুরুত্বপূর্ণ বিষয় হল ______।",
        },

        "assamese": {
            "location": "এই স্মৃতিটো ______-ৰ সৈতে জড়িত।",
            "relationship": "এই স্মৃতিত ব্যক্তিজনৰ ______ সম্পৰ্কৰ কথা কোৱা হৈছে।",
            "event": "এই স্মৃতিটো ______ অনুষ্ঠানৰ সৈতে জড়িত।",
            "activity": "এই স্মৃতিত ______ কাৰ্যকলাপৰ উল্লেখ আছে।",
            "person": "এই স্মৃতিত ______ ব্যক্তিৰ নাম উল্লেখ আছে।",
            "default": "এই স্মৃতিৰ গুৰুত্বপূৰ্ণ কথাটো হ'ল ______।",
        },
    }

    language_templates = templates.get(
        language,
        templates["english"]
    )

    return language_templates.get(
        fact_type,
        language_templates["default"]
    )


def translate_value(
    value: str,
    language: str
) -> str:

    language = language.lower()

    dictionaries = {
        "hindi": {
            "garden": "बगीचा",
            "home": "घर",
            "park": "पार्क",
            "school": "स्कूल",
            "hospital": "अस्पताल",
            "temple": "मंदिर",
            "market": "बाज़ार",
            "daughter": "बेटी",
            "son": "बेटा",
            "mother": "माँ",
            "father": "पिता",
            "brother": "भाई",
            "sister": "बहन",
            "friend": "दोस्त",
            "wife": "पत्नी",
            "husband": "पति",
            "birthday": "जन्मदिन",
            "wedding": "शादी",
            "festival": "त्योहार",
            "trip": "यात्रा",
            "holiday": "छुट्टी",
            "tea": "चाय",
            "coffee": "कॉफ़ी",
            "walking": "टहलना",
            "reading": "पढ़ना",
            "singing": "गाना",
            "cooking": "खाना बनाना",
            "shopping": "खरीदारी",
        },

        "bengali": {
            "garden": "বাগান",
            "home": "বাড়ি",
            "park": "পার্ক",
            "school": "স্কুল",
            "hospital": "হাসপাতাল",
            "temple": "মন্দির",
            "market": "বাজার",
            "daughter": "মেয়ে",
            "son": "ছেলে",
            "mother": "মা",
            "father": "বাবা",
            "brother": "ভাই",
            "sister": "বোন",
            "friend": "বন্ধু",
            "wife": "স্ত্রী",
            "husband": "স্বামী",
            "birthday": "জন্মদিন",
            "wedding": "বিয়ে",
            "festival": "উৎসব",
            "trip": "ভ্রমণ",
            "holiday": "ছুটি",
            "tea": "চা",
            "coffee": "কফি",
            "walking": "হাঁটা",
            "reading": "পড়া",
            "singing": "গান",
            "cooking": "রান্না",
            "shopping": "কেনাকাটা",
        },

        "assamese": {
            "garden": "বাগিচা",
            "home": "ঘৰ",
            "park": "উদ্যান",
            "school": "বিদ্যালয়",
            "hospital": "চিকিৎসালয়",
            "temple": "মন্দিৰ",
            "market": "বজাৰ",
            "daughter": "জীয়েক",
            "son": "পুত্ৰ",
            "mother": "মাক",
            "father": "দেউতা",
            "brother": "ভাই",
            "sister": "ভনী",
            "friend": "বন্ধু",
            "wife": "পত্নী",
            "husband": "স্বামী",
            "birthday": "জন্মদিন",
            "wedding": "বিয়া",
            "festival": "উৎসৱ",
            "trip": "ভ্ৰমণ",
            "holiday": "ছুটী",
            "tea": "চাহ",
            "coffee": "কফি",
            "walking": "খোজ কঢ়া",
            "reading": "পঢ়া",
            "singing": "গান",
            "cooking": "ৰন্ধা",
            "shopping": "কিনা-কটা",
        },
    }

    if language == "english":
        return value

    mapping = dictionaries.get(
        language,
        {}
    )

    return mapping.get(
        value.lower(),
        value
    )


def translate_options(
    options: list[str],
    language: str
) -> list[str]:
    """
    Translate multiple choice options.
    """

    return [
        translate_value(
            option,
            language
        )
        for option in options
    ]


def get_distractors(
    fact_type: str,
    answer: str
) -> list[str]:

    if fact_type == "location":
        choices = [
            "garden",
            "home",
            "park",
            "school",
        ]

    elif fact_type == "relationship":
        choices = [
            "daughter",
            "son",
            "mother",
            "father",
        ]

    elif fact_type == "event":
        choices = [
            "birthday",
            "wedding",
            "festival",
            "trip",
        ]

    elif fact_type == "activity":
        choices = [
            "tea",
            "coffee",
            "walking",
            "reading",
        ]

    elif fact_type == "person":
        choices = [
            "John",
            "Jane",
            "David",
            "Mary",
        ]

    else:
        choices = [
            "I remember this",
            "I don't remember",
            "Something else",
            "Not sure",
        ]

    if answer not in choices:
        choices[0] = answer

    choices = list(dict.fromkeys(choices))

    while len(choices) < 4:
        choices.append("Not sure")

    random.shuffle(choices)

    return choices[:4]


def generate_multiple_choice_game(
    fact: dict,
    difficulty: str,
    language: str
) -> dict:

    question = get_question_template(
        fact["type"],
        language,
    )

    options = get_distractors(
        fact["type"],
        fact["value"],
    )

    translated_options = translate_options(
        options,
        language,
    )

    answer_index = options.index(
        fact["value"]
    )

    translated_answer = translated_options[
        answer_index
    ]

    return {
        "game_type": "multiple_choice",
        "question": question,
        "options": translated_options,
        "difficulty": difficulty,
        "answer": translated_answer,
        "memory_fact": {
            "type": fact["type"],
            "value": fact["value"],
        },
    }


def generate_true_false_game(
    fact: dict,
    difficulty: str,
    language: str
) -> dict:

    true_statement = get_true_false_statement(
        fact["type"],
        fact["value"],
        language
    )

    false_value = get_false_value(
        fact["type"],
        fact["value"]
    )

    false_statement = get_true_false_statement(
        fact["type"],
        false_value,
        language
    )

    is_true = random.choice([
        True,
        False
    ])

    if is_true:
        statement = true_statement
        answer_key = "true"
    else:
        statement = false_statement
        answer_key = "false"

    translated_options = {
        "english": [
            "True",
            "False"
        ],
        "hindi": [
            "सही",
            "गलत"
        ],
        "bengali": [
            "সত্য",
            "মিথ্যা"
        ],
        "assamese": [
            "সঁচা",
            "মিছা"
        ],
    }

    options = translated_options.get(
        language.lower(),
        translated_options["english"]
    )

    answer = options[0] if answer_key == "true" else options[1]

    return {
        "game_type": "true_false",
        "question": statement,
        "options": options,
        "difficulty": difficulty,
        "answer": answer,
        "memory_fact": {
            "type": fact["type"],
            "value": fact["value"],
        },
    }


def generate_fill_blank_game(
    fact: dict,
    difficulty: str,
    language: str
) -> dict:

    question = get_fill_blank_template(
        fact["type"],
        language
    )

    answer = translate_value(
        fact["value"],
        language
    )

    return {
        "game_type": "fill_blank",
        "question": question,
        "options": [],
        "difficulty": difficulty,
        "answer": answer,
        "memory_fact": {
            "type": fact["type"],
            "value": fact["value"],
        },
    }



def _get_facts_by_type(facts: list[dict], fact_type: str) -> list[dict]:
    """Return facts of a requested type."""
    return [fact for fact in facts if fact.get("type") == fact_type]


def _pick_fact(facts: list[dict], preferred_types: list[str]) -> dict:
    """Pick a fact from preferred types, falling back to any explicit fact."""
    for fact_type in preferred_types:
        candidates = _get_facts_by_type(facts, fact_type)
        if candidates:
            return random.choice(candidates)
    return random.choice(facts)


def get_attention_options(facts: list[dict], answer: str) -> list[str]:
    """Build short, concrete options for an attention challenge."""
    values = []
    seen = set()

    for fact in facts:
        value = str(fact.get("value", "")).strip()
        if value and value.lower() not in seen:
            values.append(value)
            seen.add(value.lower())

    distractors = [
        "morning", "evening", "Sunday", "Monday",
        "market", "school", "garden", "park", "tea", "coffee",
    ]

    for value in distractors:
        if value.lower() != answer.lower() and value.lower() not in seen:
            values.append(value)
            seen.add(value.lower())
        if len(values) >= 4:
            break

    if answer.lower() not in {value.lower() for value in values}:
        values.insert(0, answer)

    random.shuffle(values)
    return values[:4]


def generate_attention_game(
    facts: list[dict],
    difficulty: str,
    language: str,
) -> dict:
    """Generate an attention/concentration challenge from memory facts."""
    fact = _pick_fact(
        facts,
        ["person", "location", "relationship", "event", "activity"],
    )

    questions = {
        "english": "Look carefully at the memory. Which detail is mentioned?",
        "hindi": "याद को ध्यान से देखें। इनमें से कौन-सी बात याद में बताई गई है?",
        "bengali": "স্মৃতিটা মন দিয়ে দেখুন। কোন কথাটি এই স্মৃতিতে আছে?",
        "assamese": "স্মৃতিটো মন দি চাওক। কোন কথাটো এই স্মৃতিত আছে?",
    }

    question = questions.get(language.lower(), questions["english"])
    options = get_attention_options(facts, fact["value"])
    translated_options = translate_options(options, language)
    answer_index = options.index(fact["value"])

    return {
        "game_type": "attention",
        "question": question,
        "options": translated_options,
        "difficulty": difficulty,
        "answer": translated_options[answer_index],
        "memory_fact": {"type": fact["type"], "value": fact["value"]},
    }


def generate_routine_recall_game(
    facts: list[dict],
    difficulty: str,
    language: str,
) -> dict:
    """Generate a daily-routine recall question from an activity fact."""
    activity_facts = _get_facts_by_type(facts, "activity")
    fact = random.choice(activity_facts) if activity_facts else _pick_fact(
        facts,
        ["location", "event", "relationship"],
    )

    questions = {
        "english": "Which familiar activity was part of this memory?",
        "hindi": "इस याद में कौन-सी परिचित गतिविधि थी?",
        "bengali": "এই স্মৃতিতে কোন পরিচিত কাজটি ছিল?",
        "assamese": "এই স্মৃতিত কোন চিনাকি কাৰ্যকলাপ আছিল?",
    }

    question = questions.get(language.lower(), questions["english"])
    options = get_distractors(fact["type"], fact["value"])
    translated_options = translate_options(options, language)
    answer_index = options.index(fact["value"])

    return {
        "game_type": "routine_recall",
        "question": question,
        "options": translated_options,
        "difficulty": difficulty,
        "answer": translated_options[answer_index],
        "memory_fact": {"type": fact["type"], "value": fact["value"]},
    }


def generate_pattern_recognition_game(
    facts: list[dict],
    difficulty: str,
    language: str,
) -> dict:
    """Generate a simple ordered memory-pattern game."""
    sequence = []

    for fact_type in ["location", "relationship", "event", "activity", "person"]:
        matches = _get_facts_by_type(facts, fact_type)
        if matches:
            sequence.append(matches[0]["value"])

    if not sequence:
        sequence = [facts[0]["value"]]

    if len(sequence) == 1:
        sequence.append(sequence[0])

    pattern = [translate_value(value, language) for value in sequence[:3]]
    answer_source = sequence[-1]
    answer = translate_value(answer_source, language)

    distractors = get_distractors(facts[-1]["type"], answer_source)
    options = [answer] + [
        value for value in translate_options(distractors, language)
        if value.lower() != answer.lower()
    ]
    options = list(dict.fromkeys(options))[:4]

    while len(options) < 4:
        options.append("Not sure")

    random.shuffle(options)

    questions = {
        "english": f"Complete the memory pattern: {' → '.join(pattern[:-1])} → ____",
        "hindi": f"याद के क्रम को पूरा करें: {' → '.join(pattern[:-1])} → ____",
        "bengali": f"স্মৃতির ধারাটি পূরণ করুন: {' → '.join(pattern[:-1])} → ____",
        "assamese": f"স্মৃতিৰ ক্ৰমটো সম্পূৰ্ণ কৰক: {' → '.join(pattern[:-1])} → ____",
    }

    question = questions.get(language.lower(), questions["english"])

    return {
        "game_type": "pattern_recognition",
        "question": question,
        "options": options,
        "difficulty": difficulty,
        "answer": answer,
        "memory_fact": {"type": facts[-1]["type"], "value": answer_source},
    }


def generate_object_recognition_game(
    facts: list[dict],
    difficulty: str,
    language: str,
) -> dict:
    """Generate an object/familiar-item recognition game."""
    object_like = [
        fact for fact in facts
        if fact.get("type") in {"activity", "location"}
    ]
    fact = random.choice(object_like) if object_like else random.choice(facts)

    object_options = [
        "tea", "coffee", "book", "chair",
        "garden", "home", "market", "park",
    ]

    options = [fact["value"]]
    seen = {fact["value"].lower()}

    for item in object_options:
        if item.lower() not in seen:
            options.append(item)
            seen.add(item.lower())
        if len(options) >= 4:
            break

    translated_options = translate_options(options, language)
    answer_index = options.index(fact["value"])

    questions = {
        "english": "Which familiar item or place is part of this memory?",
        "hindi": "इस याद में कौन-सी परिचित चीज़ या जगह है?",
        "bengali": "এই স্মৃতিতে কোন পরিচিত জিনিস বা স্থান আছে?",
        "assamese": "এই স্মৃতিত কোন চিনাকি বস্তু বা ঠাই আছে?",
    }

    question = questions.get(language.lower(), questions["english"])

    return {
        "game_type": "object_recognition",
        "question": question,
        "options": translated_options,
        "difficulty": difficulty,
        "answer": translated_options[answer_index],
        "memory_fact": {"type": fact["type"], "value": fact["value"]},
    }


def generate_emotional_engagement_game(
    memory: dict,
    facts: list[dict],
    difficulty: str,
    language: str,
) -> dict:
    """Generate a gentle personal-engagement question tied to the memory."""
    category = str(memory.get("category", "")).lower()
    relationship_facts = _get_facts_by_type(facts, "relationship")
    event_facts = _get_facts_by_type(facts, "event")

    if category == "family" and not relationship_facts:
        fact = {"type": "relationship", "value": "family"}
        options = translate_options(
            ["family", "friend", "school", "market"],
            language,
        )
        answer = translate_value("family", language)
    elif relationship_facts:
        fact = random.choice(relationship_facts)
        answer = translate_value(fact["value"], language)
        options = translate_options(
            get_distractors("relationship", fact["value"]),
            language,
        )
    elif event_facts:
        fact = random.choice(event_facts)
        answer = translate_value(fact["value"], language)
        options = translate_options(
            get_distractors("event", fact["value"]),
            language,
        )
    else:
        fact = _pick_fact(facts, ["activity", "location", "person"])
        answer = translate_value(fact["value"], language)
        options = translate_options(
            get_distractors(fact["type"], fact["value"]),
            language,
        )

    questions = {
        "english": "Which part of this memory may feel personally meaningful?",
        "hindi": "इस याद का कौन-सा हिस्सा आपके लिए खास हो सकता है?",
        "bengali": "এই স্মৃতির কোন অংশটি আপনার কাছে বিশেষ মনে হতে পারে?",
        "assamese": "এই স্মৃতিৰ কোনটো অংশ আপোনাৰ বাবে বিশেষ হ'ব পাৰে?",
    }

    question = questions.get(language.lower(), questions["english"])

    if answer.lower() not in {value.lower() for value in options}:
        options.insert(0, answer)

    options = list(dict.fromkeys(options))[:4]
    while len(options) < 4:
        options.append("Not sure")

    random.shuffle(options)

    return {
        "game_type": "emotional_engagement",
        "question": question,
        "options": options,
        "difficulty": difficulty,
        "answer": answer,
        "memory_fact": {"type": fact["type"], "value": fact["value"]},
    }


def generate_ai_game(memory: dict) -> dict:
    """
    Generate a personalized game.

    Supported game types:
    - multiple_choice
    - true_false
    - fill_blank
    - attention
    - routine_recall
    - pattern_recognition
    - object_recognition
    - emotional_engagement
    """

    content = memory.get(
        "content",
        ""
    )

    difficulty = memory.get(
        "difficulty",
        "easy"
    )

    language = memory.get(
        "language",
        "English"
    )

    requested_game_type = memory.get(
        "game_type",
        "multiple_choice"
    )

    memory_dna = memory.get(
        "memory_dna"
    )

    if memory_dna and memory_dna.get("facts"):
        facts = memory_dna["facts"]
    else:
        facts = extract_memory_facts(
            content
        )

    if not facts:
        raise ValueError(
            "AI game rejected: no explicit facts were found in the memory."
        )

    fact = random.choice(facts)

    if requested_game_type == "true_false":
        return generate_true_false_game(
            fact=fact,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "fill_blank":
        return generate_fill_blank_game(
            fact=fact,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "attention":
        return generate_attention_game(
            facts=facts,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "routine_recall":
        return generate_routine_recall_game(
            facts=facts,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "pattern_recognition":
        return generate_pattern_recognition_game(
            facts=facts,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "object_recognition":
        return generate_object_recognition_game(
            facts=facts,
            difficulty=difficulty,
            language=language
        )

    if requested_game_type == "emotional_engagement":
        return generate_emotional_engagement_game(
            memory=memory,
            facts=facts,
            difficulty=difficulty,
            language=language
        )

    return generate_multiple_choice_game(
        fact=fact,
        difficulty=difficulty,
        language=language
    )