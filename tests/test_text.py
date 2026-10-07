import sys
import numpy as np
import pytest
sys.path.append('src/text')
from text_preprocessing import preprocess_clinical_text
from biobert_encoder import BioBERTEncoder

def test_preprocess_clinical_text():
    raw_text = "   Patient    has HTA...  \n  BP 120/80  "
    clean = preprocess_clinical_text(raw_text)
    assert clean == "Patient has HTA... BP 120/80"
    
def test_biobert_initialization():
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    assert encoder.model is not None
    assert encoder.max_length == 512
    
def test_biobert_encoding_short():
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    text = "The patient presents with shortness of breath."
    emb_cls = encoder.encode_note(text, pooling='cls')
    emb_mean = encoder.encode_note(text, pooling='mean')
    
    assert emb_cls.shape == (768,)
    assert emb_mean.shape == (768,)
    assert not np.isnan(emb_cls).any()
    assert not np.isnan(emb_mean).any()

def test_biobert_encoding_long_chunking():
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    text = "blood pressure " * 1000  # Will definitely exceed 512 tokens
    
    emb_mean = encoder.encode_note(text, pooling='mean')
    assert emb_mean.shape == (768,)
    assert not np.isnan(emb_mean).any()

def test_empty_string():
    encoder = BioBERTEncoder(model_name="emilyalsentzer/Bio_ClinicalBERT")
    emb = encoder.encode_note("   ", pooling='mean')
    assert emb.shape == (768,)
    assert np.all(emb == 0.0)
