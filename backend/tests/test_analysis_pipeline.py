from app.ai.entity_extractor import extract_entities


def test_extract_entities_includes_crime_type_and_key_entities():
    text = (
        "A 42-year-old businessman was found dead inside his office at approximately 10 PM. "
        "CCTV footage shows one unidentified person entering the building. "
        "The victim had financial disputes with his business partner. "
        "Fingerprints were recovered from the weapon."
    )

    entities = extract_entities(text)

    assert entities["victims"]
    assert entities["suspects"]
    assert entities["witnesses"] or entities["locations"]
    assert "crime_type" in entities
    assert entities["crime_type"] == "Murder"
