import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

class BioBERTEncoder:
    def __init__(self, model_name="emilyalsentzer/Bio_ClinicalBERT", device=None):
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = device
            
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        
        self.max_length = 512
        self.chunk_size = 510  # leaving room for CLS and SEP
        self.overlap = 50
        
    def chunk_tokens(self, input_ids):
        """Chunk a long sequence of input_ids with overlap."""
        # Remove CLS and SEP if present
        if input_ids[0] == self.tokenizer.cls_token_id:
            input_ids = input_ids[1:]
        if input_ids[-1] == self.tokenizer.sep_token_id:
            input_ids = input_ids[:-1]
            
        chunks = []
        start = 0
        while start < len(input_ids):
            end = min(start + self.chunk_size, len(input_ids))
            chunk = [self.tokenizer.cls_token_id] + input_ids[start:end] + [self.tokenizer.sep_token_id]
            chunks.append(chunk)
            if end == len(input_ids):
                break
            start += self.chunk_size - self.overlap
            
        return chunks

    @torch.no_grad()
    def encode_note(self, text, pooling='mean'):
        """
        Encode a single note, handling chunking if necessary.
        pooling: 'cls' or 'mean'
        """
        if not text.strip():
            return np.zeros(self.model.config.hidden_size, dtype=np.float32)
            
        tokens = self.tokenizer(text, truncation=False, return_tensors="pt", add_special_tokens=True)
        input_ids = tokens['input_ids'][0].tolist()
        
        if len(input_ids) <= self.max_length:
            input_ids_tensor = torch.tensor([input_ids]).to(self.device)
            attention_mask = torch.ones_like(input_ids_tensor).to(self.device)
            
            outputs = self.model(input_ids=input_ids_tensor, attention_mask=attention_mask)
            if pooling == 'cls':
                emb = outputs.last_hidden_state[0, 0, :].cpu().numpy()
            elif pooling == 'mean':
                emb = outputs.last_hidden_state[0, 1:-1, :].mean(dim=0).cpu().numpy()
            return emb
            
        else:
            # Chunking required
            chunks = self.chunk_tokens(input_ids)
            chunk_embs = []
            for c in chunks:
                c_tensor = torch.tensor([c]).to(self.device)
                mask = torch.ones_like(c_tensor).to(self.device)
                out = self.model(input_ids=c_tensor, attention_mask=mask)
                
                if pooling == 'cls':
                    c_emb = out.last_hidden_state[0, 0, :]
                elif pooling == 'mean':
                    c_emb = out.last_hidden_state[0, 1:-1, :].mean(dim=0)
                chunk_embs.append(c_emb)
                
            # Aggregate chunks by mean
            final_emb = torch.stack(chunk_embs).mean(dim=0).cpu().numpy()
            return final_emb
