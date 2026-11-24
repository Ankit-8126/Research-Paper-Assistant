import fitz


def extract_text_from_pdf(file_path: str):

    pdf_document = fitz.open(file_path)

    extracted_text = ""

    for page in pdf_document:
        extracted_text += page.get_text()

    pdf_document.close()

    return extracted_text