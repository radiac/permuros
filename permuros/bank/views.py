from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import Transaction


@login_required
def transactions(request):
    return render(
        request,
        "bank/transactions.html",
        context={
            "transactions": Transaction.objects.all(),
            "total": Transaction.objects.total(),
        },
    )
