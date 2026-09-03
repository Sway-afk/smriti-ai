def extract_memory_facts(content: str) -> list[dict]:
    """
    Extract simple, explicit facts from the patient's memory.
    """

    facts = []

    locations = [
        "Jaipur",
        "Delhi",
        "Mumbai",
        "Chennai",
        "Kolkata",
        "Bengaluru",
        "Guwahati",
        "Assam",
    ]

    relationships = [
        "daughter",
        "son",
        "mother",
        "father",
        "brother",
        "sister",
        "friend",
    ]

    events = [
        "wedding",
        "birthday",
        "festival",
        "marriage",
        "trip",
        "holiday",
    ]

    content_lower = content.lower()

    for location in locations:
        if location.lower() in content_lower:
            facts.append({
                "type": "location",
                "value": location,
            })

    for relationship in relationships:
        if relationship.lower() in content_lower:
            facts.append({
                "type": "relationship",
                "value": relationship,
            })

    for event in events:
        if event.lower() in content_lower:
            facts.append({
                "type": "event",
                "value": event,
            })

    return facts


def get_question_template(fact_type: str, language: str) -> str:
    """
    Return a reliable question in the requested language.
    """

    language_lower = language.lower()

    if fact_type == "location":

        if language_lower == "hindi":
            return "यह याद किस शहर से जुड़ी है?"

        if language_lower == "bengali":
            return "এই স্মৃতিটি কোন শহরের সঙ্গে সম্পর্কিত?"

        if language_lower == "assamese":
            return "এই স্মৃতিটো কোনখন চহৰৰ সৈতে জড়িত?"

        return "Which city is mentioned in this memory?"

    if fact_type == "relationship":

        if language_lower == "hindi":
            return "इस याद में कौन-सा रिश्ता बताया गया है?"

        if language_lower == "bengali":
            return "এই স্মৃতিতে কোন সম্পর্কের কথা বলা হয়েছে?"

        if language_lower == "assamese":
            return "এই স্মৃতিত কোনটো সম্পৰ্কৰ কথা কোৱা হৈছে?"

        return "Which relationship is mentioned in this memory?"

    if fact_type == "event":

        if language_lower == "hindi":
            return "इस याद में कौन-सा अवसर बताया गया है?"

        if language_lower == "bengali":
            return "এই স্মৃতিতে কোন অনুষ্ঠানের কথা বলা হয়েছে?"

        if language_lower == "assamese":
            return "এই স্মৃতিত কোনটো অনুষ্ঠানৰ কথা কোৱা হৈছে?"

        return "Which event is mentioned in this memory?"

    return "What do you remember from this memory?"


def get_distractors(fact_type: str, answer: str) -> list[str]:
    """
    Create safe answer choices from a fixed backend list.

    The AI does NOT generate these choices.
    """

    if fact_type == "location":

        choices = [
            "Jaipur",
            "Delhi",
            "Mumbai",
            "Chennai",
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
            "wedding",
            "birthday",
            "festival",
            "trip",
        ]

    else:

        choices = [
            "I remember this",
            "I don't remember",
            "Something different happened",
            "I am not sure",
        ]

    # Make sure the correct answer is included.
    if answer not in choices:
        choices[0] = answer

    # Remove duplicates.
    choices = list(dict.fromkeys(choices))

    # Guarantee four options.
    while len(choices) < 4:
        choices.append("I am not sure")

    return choices[:4]


def generate_ai_game(memory: dict) -> dict:
    """
    Generate a safe memory-based cognitive game.

    For the current MVP:
    - Backend extracts the fact.
    - Backend creates the question.
    - Backend creates the options.
    - Backend controls the answer.

    This prevents hallucinations from the local AI model.
    """

    content = memory.get("content", "")
    difficulty = memory.get("difficulty", "easy")
    language = memory.get("language", "English")

    facts = extract_memory_facts(content)

    if not facts:
        raise ValueError(
            "AI game rejected: no explicit facts were found in the memory"
        )

    # Use the first explicit fact detected.
    fact = facts[0]

    fact_type = fact["type"]
    answer = fact["value"]

    # Create a safe question.
    question = get_question_template(
        fact_type,
        language,
    )

    # Create safe options.
    options = get_distractors(
        fact_type,
        answer,
    )

    return {
        "game_type": "multiple_choice",
        "question": question,
        "options": options,
        "difficulty": difficulty,
        "answer": answer,
    }