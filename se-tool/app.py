import os
from flask import Flask, render_template, request, jsonify
import anthropic

app = Flask(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an expert Solutions Engineer at Checkout.com, a leading payments infrastructure company.
You help Solutions Engineering teams extract structured, high-quality outputs from merchant call transcripts.
Your outputs are precise, technical where needed, and follow payments industry best practices."""

SDD_PROMPT = """Based on the following call transcript, write a Solution Design Document (SDD).

Structure it as:
## Merchant Overview
- Company name, industry, business model

## Technical Requirements
- Payment methods needed
- Integration type (API, hosted, SDK)
- Platforms (web, mobile, POS)
- Currencies and geographies

## Key Challenges & Risks
- Technical complexity, compliance requirements (PCI, 3DS, etc.), fraud considerations

## Recommended Solution
- Recommended Checkout.com products and integration approach
- Justification for each recommendation

## Next Steps
- Concrete action items with owners (SE, merchant, etc.)

Transcript:
{transcript}"""

SALESFORCE_PROMPT = """Based on the following call transcript, generate a Salesforce CRM update.

Structure it as:
**Deal Stage**: [Current stage based on conversation]
**Next Step**: [Single most important next action]
**Next Step Date**: [Suggested date if mentioned, otherwise TBD]
**Call Summary** (3-5 bullet points):
- Key points discussed

**Technical Requirements Identified**:
- List any technical specs, integrations, or requirements mentioned

**Risk Flags** (if any):
- Compliance, timeline, or technical risks worth flagging

Transcript:
{transcript}"""

FOLLOWUP_PROMPT = """Based on the following call transcript, write a professional follow-up email from the Solutions Engineer to the merchant.

The email should:
- Open with a warm, brief recap of the call
- Confirm the key points discussed and any decisions made
- List clear next steps with owners (what the SE will do, what the merchant needs to provide)
- Be concise — no fluff, no padding
- Tone: professional but human, not overly formal
- Sign off as "The Checkout.com Solutions Engineering Team"

Do not invent specific names, dates, or details not mentioned in the transcript.

Transcript:
{transcript}"""


def generate_output(prompt_template: str, transcript: str) -> str:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt_template.format(transcript=transcript)}
        ],
    )
    return message.content[0].text


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    transcript = data.get("transcript", "").strip()

    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    if len(transcript) < 50:
        return jsonify({"error": "Transcript seems too short. Please paste the full call transcript."}), 400

    try:
        sdd = generate_output(SDD_PROMPT, transcript)
        salesforce = generate_output(SALESFORCE_PROMPT, transcript)
        followup = generate_output(FOLLOWUP_PROMPT, transcript)

        return jsonify({
            "sdd": sdd,
            "salesforce": salesforce,
            "followup": followup,
        })
    except anthropic.AuthenticationError:
        return jsonify({"error": "Invalid API key. Set ANTHROPIC_API_KEY environment variable."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
