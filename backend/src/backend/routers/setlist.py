from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from ..auth import verify_token
from ..models import Setlist
from ..pdf import render_pdf

router = APIRouter(
    prefix="/api/setlist",
    tags=["setlist"],
    dependencies=[Depends(verify_token)],
)


@router.post("/pdf")
def export_pdf(
    setlist: Setlist,
    mode: str = Query(default="mono", pattern="^(color|mono)$"),
) -> Response:
    # セットリストはサーバーに保存せず、リクエストボディの内容からPDF化する
    pdf_bytes = render_pdf(setlist, mode)
    filename = "setlist-color.pdf" if mode == "color" else "setlist.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
