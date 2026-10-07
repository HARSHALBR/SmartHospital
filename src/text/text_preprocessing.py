import re

def preprocess_clinical_text(text: str) -> str:
    """
    Minimal preprocessing to preserve clinical terminology.
    - Lowercase
    - Remove extra whitespace
    - Preserve punctuation (useful for BERT)
    - Do NOT stem, lemmatize, or remove stopwords.
    """
    if not isinstance(text, str):
        return ""
        
    # Basic whitespace normalization
    text = re.sub(r'\s+', ' ', text).strip()
    # Lowercase to match BioBERT uncased/cased behavior usually preferred for clinical text
    # Though biobert-base-cased-v1.2 is cased, lowercasing clinical notes often reduces noise 
    # unless using a specifically cased clinical model. We'll leave original casing to be safe.
    
    return text
