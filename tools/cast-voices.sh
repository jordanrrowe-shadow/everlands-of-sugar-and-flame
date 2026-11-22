#!/usr/bin/env bash
# Voice assignments for the whole cast. Usage: ELEVENLABS_API_KEY=... bash tools/cast-voices.sh
cd "$(dirname "$0")/.." && ELEVENLABS_MODEL=${ELEVENLABS_MODEL:-eleven_v3} node tools/voices.mjs \
  "Amber=yc9L2aRZAnn468VxKrTM" "Kim=vGfq3y2g8QTWjuUhrNYc" \
  "The King=gRPwZFYxBbXTrxXJzU6u" "Lord Ashlock=83MXTnoLsr3jX4Sl4gL4" "Master Aldren=OlQWvlX92ByiBPMvucf0" "The Steward=pqHfZKP75CvOlQylNhV4" \
  "Master Orin=PbdeBaBBJTgZkIRcTU1J" "Tafford=W93ubvztnBbrUnasPBDG" "Ironwright Brand=NPVegEkwslClHaSZqnyS" "Palace Guard=NPVegEkwslClHaSZqnyS" "Cinderwarden=NPVegEkwslClHaSZqnyS" \
  "Second Warden=W93ubvztnBbrUnasPBDG" "Attendant=ujcXHLWtGPYXnqBoMBgg" "Archivist=pqHfZKP75CvOlQylNhV4" "Marsh=OlQWvlX92ByiBPMvucf0" "Traveller=pqHfZKP75CvOlQylNhV4" \
  "Cider Seller=PbdeBaBBJTgZkIRcTU1J" "Balloonist=W93ubvztnBbrUnasPBDG" "Ribbon Merchant=PbdeBaBBJTgZkIRcTU1J" "Confectioner=PbdeBaBBJTgZkIRcTU1J" "Linen Boy=ujcXHLWtGPYXnqBoMBgg" "Honey Boy=ujcXHLWtGPYXnqBoMBgg" \
  "Smorella=8fwYhwfiWkLjR4FKLHSQ" "Madame Praline=jVMsZEw3hfmEAe9OUUtS" "Grandma Lava=nyQ6Ftl3gFwx4EgtQvN1" "Lamp-tender=mdpRX5ndZ28fmYwb5P0J" \
  "Etiquette Mistress=98dvI6mDdyv5hVpyJA5M" "Royal Physician=g12yXXabMWeFoLMzxPrF" "Glassmaker Vessa=DkFA3CCM7ph3MIx3WWuP" "Candle-maker Lumi=ofWwoMxOYgLntvYlQLiB" "Flame Dancer=ofWwoMxOYgLntvYlQLiB" \
  "Sled Keeper=DkFA3CCM7ph3MIx3WWuP" "Pastry Carrier=h5EerLZbdVHFXe9rEGjM" "Second Traveller=h5EerLZbdVHFXe9rEGjM" \
  "Market Child=CqSwFbfWKBt9DQkSW9UV" "Very Small Girl=CqSwFbfWKBt9DQkSW9UV" "Sugarland Child=CqSwFbfWKBt9DQkSW9UV" "Little Kim=CqSwFbfWKBt9DQkSW9UV"
