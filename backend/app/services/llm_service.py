
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found. Check your .env file.")

client = Groq(api_key=GROQ_API_KEY)


def test_groq_connection():
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": "Reply with exactly: Groq connection successful"
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


def generate_paper_summary(extracted_text: str):

    if not extracted_text.strip():
        raise ValueError("Paper text is empty")

    prompt = f"""
    You are an expert research paper analyst.

    Analyze the following research paper text and generate a clear summary.

    Include these sections:

    1. Research Problem
    2. Main Objective
    3. Methodology
    4. Key Findings
    5. Conclusion

    Use simple and understandable English.
    Do not invent information that is not present in the paper.

    Research Paper Text:
    {extracted_text[:12000]}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


def generate_key_points(extracted_text: str):

    if not extracted_text.strip():
        raise ValueError("Paper text is empty")

    prompt = f"""
    You are an expert research paper analyst.

    Analyze the research paper and extract its most important findings.

    IMPORTANT OUTPUT RULES:

    1. Generate a maximum of 10 key points.
    2. Each key point must represent one complete and meaningful idea.
    3. Combine related sub-points into one key point.
    4. Do not split a single idea into multiple bullet points.
    5. Do not use nested bullet points or sub-numbering.
    6. Avoid repeating the same information.
    7. Keep each point concise and understandable.
    8. Use simple English.
    9. Only include information supported by the paper.
    10. Never invent research results or findings.

    Cover these topics where information is available:
    - Main Contributions
    - Key Findings
    - Research Limitations
    - Future Scope
    - Important Takeaways

    OUTPUT FORMAT:

    Return only bullet points.
    Each point must start with a single hyphen (-).
    Do not include category headings.
    Do not include an introduction or conclusion outside the bullet points.

    If a topic is not discussed in the paper, do not create a separate
    point for it unless it is important to mention that information
    is not specified.

    Research Paper Text:
    {extracted_text[:12000]}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


def generate_paper_answer(
    extracted_text: str,
    question: str,
    chat_history: list = None
):
    if not extracted_text.strip():
        raise ValueError("Paper text is empty")

    if not question.strip():
        raise ValueError("Question cannot be empty")

    messages = [
        {
            "role": "system",
            "content": """
You are an intelligent Research Paper Assistant.

Your task is to answer the user's questions accurately
using the provided research paper text.

IMPORTANT INSTRUCTIONS:

1. Carefully read the complete available research paper text.
2. First identify which section or information is relevant
   to the user's question.
3. Search for relevant information even if it appears under
   headings such as:
   - Key Findings
   - Results
   - Main Contributions
   - Conclusion
   - Methodology
   - Important Takeaways
4. Answer the user's question directly using the information
   found in the paper.
5. Combine relevant information from different sections
   when necessary.
6. Use simple and understandable English.
7. Use bullet points or numbered lists when appropriate.
8. Do not repeat the entire paper when a short answer is enough.
9. Never invent facts, results, statistics, or findings.
10. Only say "This information is not specified in the paper"
    after checking the available paper text and confirming
    that the requested information is genuinely absent.
11. If the paper contains related information but not an exact
    answer, explain what the paper actually mentions.

The paper content is provided below:

<research_paper>
"""
            + extracted_text[:20000]
            + """
</research_paper>
"""
        }
    ]

    if chat_history:
        messages.extend(chat_history[-10:])

    messages.append({
        "role": "user",
        "content": question
    })

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=0.2
    )

    return response.choices[0].message.content
