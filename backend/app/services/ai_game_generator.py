import random


def extract_memory_facts(content: str) -> list[dict]:
    """
    Extract explicit facts from a memory.
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

    # -------------------------
    # Events
    # -------------------------

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

    # -------------------------
    # Activities
    # -------------------------

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

    # -------------------------
    # Simple person-name detection
    # -------------------------

    words = content.split()

    for word in words:
        cleaned = word.strip(".,!?")

        if cleaned.istitle():
            facts.append({
                "type": "person",
                "value": cleaned,
            })

    return facts


def get_question_template(fact_type: str, language: str) -> str:
    """
    Returns translated question templates.
    Supports:
    English
    Hindi
    Bengali
    Assamese
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

    lang = templates.get(language, templates["english"])

    return lang.get(fact_type, lang["default"])


def translate_options(options: list[str], language: str) -> list[str]:
    """
    Translate multiple choice options.
    """

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
            "tea": "चाय",
            "coffee": "कॉफ़ी",
            "walking": "टहलना",
            "reading": "पढ़ना",
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
            "tea": "চা",
            "coffee": "কফি",
            "walking": "হাঁটা",
            "reading": "পড়া",
        },

        "assamese": {
            "garden": "বাগিচা",
            "home": "ঘৰ",
            "park": "উদ্যান",
            "school": "বিদ্যালয়",
            "hospital": "হাসপাতাল",
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
            "tea": "চাহ",
            "coffee": "কফি",
            "walking": "খোজ কঢ়া",
            "reading": "পঢ়া",
        },
    }

    if language == "english":
        return options

    mapping = dictionaries.get(language, {})

    translated = []
    for option in options:
        translated.append(mapping.get(option.lower(), option))

    return translated


def get_distractors(fact_type: str, answer: str) -> list[str]:

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


def generate_ai_game(memory: dict) -> dict:

    content = memory.get("content", "")
    difficulty = memory.get("difficulty", "easy")
    language = memory.get("language", "English")

    facts = extract_memory_facts(content)

    if not facts:
        raise ValueError(
            "AI game rejected: no explicit facts were found in the memory."
        )

    fact = facts[0]

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

    answer_index = options.index(fact["value"])
    translated_answer = translated_options[answer_index]

    return {
        "game_type": "multiple_choice",
        "question": question,
        "options": translated_options,
        "difficulty": difficulty,
        "answer": translated_answer,
    }