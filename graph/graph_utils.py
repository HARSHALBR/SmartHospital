import pandas as pd
import numpy as np

def parse_and_sort_time(df):
    """Parses frame.time safely and sorts the dataframe."""
    if 'frame.time' in df.columns:
        # Try to slice first 19 chars: e.g. "2021-11-24 13:46:11"
        try:
            # Check if it looks like a year starting format or string
            temp_time = df['frame.time'].astype(str).str[:19]
            df['parsed_time'] = pd.to_datetime(temp_time, errors='coerce')
        except:
            df['parsed_time'] = pd.NaT

        # Drop rows where time parsing failed to avoid breaking sort, or just fill with epoch
        df['parsed_time'] = df['parsed_time'].fillna(pd.Timestamp('1970-01-01'))
        df = df.sort_values('parsed_time').reset_index(drop=True)
    return df

class NodeMapper:
    def __init__(self):
        self.mapping = {}
        self.reverse_mapping = {}

    def get_id(self, ip):
        if ip not in self.mapping:
            new_id = len(self.mapping)
            self.mapping[ip] = new_id
            self.reverse_mapping[new_id] = ip
        return self.mapping[ip]
        
    def save(self, filepath):
        import json
        with open(filepath, 'w') as f:
            json.dump(self.mapping, f, indent=4)
