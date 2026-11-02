# Architecture rules
- Keep localized display strings out of Home DTOs and scan ranking results; translate counts and labels at render time so language changes do not require new data reads.
- Pass the selected language explicitly to assistant requests and enforce it with the shared language normalizer in the function; conversation text remains unchanged.
- Translate application-owned copy only; never translate user-authored names, messages, services, opportunities, or reviews automatically.