
from fastapi import APIRouter, HTTPException, Query
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError

import json


router = APIRouter(
    prefix="/published-papers",
    tags=["Published Papers"]
)


def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return "Abstract not available."

    words = []

    for word, positions in inverted_index.items():
        for position in positions:
            words.append((position, word))

    words.sort(key=lambda item: item[0])

    return " ".join(word for position, word in words)


@router.get("/search")
def search_published_papers(
    query: str = Query(..., min_length=2, max_length=200),
    per_page: int = Query(10, ge=1, le=20)
):
    params = urlencode({
        "search": query,
        "per-page": per_page,
        "select": (
            "id,doi,title,publication_year,authorships,"
            "primary_location,best_oa_location,open_access,"
            "cited_by_count,abstract_inverted_index,type"
        )
    })

    url = f"https://api.openalex.org/works?{params}"

    request = Request(
        url,
        headers={
            "User-Agent": "ResearchPaperAssistant/1.0"
        }
    )

    try:
        with urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))

    except (HTTPError, URLError, TimeoutError):
        raise HTTPException(
            status_code=502,
            detail="Unable to fetch published papers. Please try again."
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Something went wrong while searching published papers."
        )

    papers = []

    for item in data.get("results", []):
        authors = []

        for authorship in item.get("authorships", []):
            author = authorship.get("author", {})
            author_name = author.get("display_name")

            if author_name:
                authors.append(author_name)

        primary_location = item.get("primary_location") or {}
        source = primary_location.get("source") or {}

        best_oa_location = item.get("best_oa_location") or {}
        open_access = item.get("open_access") or {}

        doi = item.get("doi")

        paper_url = (
            primary_location.get("landing_page_url")
            or doi
            or item.get("id")
        )

        pdf_url = best_oa_location.get("pdf_url")

        papers.append({
            "id": item.get("id"),
            "title": item.get("title") or "Title not available",
            "authors": authors,
            "publication_year": item.get("publication_year"),
            "journal": source.get("display_name"),
            "abstract": reconstruct_abstract(
                item.get("abstract_inverted_index")
            ),
            "doi": doi,
            "paper_url": paper_url,
            "pdf_url": pdf_url,
            "is_open_access": open_access.get("is_oa", False),
            "citations": item.get("cited_by_count", 0),
            "type": item.get("type")
        })

    return {
        "query": query,
        "total_results": data.get("meta", {}).get("count", 0),
        "results_count": len(papers),
        "papers": papers
    }
