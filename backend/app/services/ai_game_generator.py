import random
import re


def extract_memory_facts(content: str) -> list[dict]:
    """
    Extract explicit facts from a memory.
    """

    facts = []
    content_lower = content.lower()

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

    relationships = [
        "daughter",
        "son",
        "mother",
        "father",
        "brother",
        "sister",
        "friend",
        "wife",
        "husband",
        "grandmother",
        "grandfather",
    ]

    for relationship in relationships:
        if relationship.lower() in content_lower:
            facts.append({
                "type": "relationship",
                "value": relationship,
            })

    events = [
        "wedding",
        "birthday",
        "festival",
        "marriage",
        "trip",
        "holiday",
    ]

    for event in events:
        if event.lower() in content_lower:
            facts.append({
                "type": "event",
                "value": event,
            })

    activities = [
        "tea",
        "coffee",
        "breakfast",
        "lunch",
        "dinner",
        "walking",
        "reading",
        "singing",
        "cooking",
        "shopping",
    ]

    for activity in activities:
        if activity.lower() in content_lower:
            facts.append({
                "type": "activity",
                "value": activity,
            })

    known_words = {
        word.lower()
        for word in (
            locations
            + relationships
            + events
            + activities
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
        answer = "True"
    else:
        statement = false_statement
        answer = "False"

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


def generate_ai_game(memory: dict) -> dict:
    """
    Generate a personalized game.

    Supported game types:
    - multiple_choice
    - true_false
    - fill_blank
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

    return generate_multiple_choice_game(
        fact=fact,
        difficulty=difficulty,
        language=language
    )