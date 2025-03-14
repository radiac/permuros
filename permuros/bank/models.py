from decimal import Decimal

from django.db import models
from django.db.models import Sum


class TransactionQuerySet(models.QuerySet):
    def total(self):
        total = self.aggregate(total=Sum("amount"))["total"]
        if total is None:
            return Decimal("0.00")

        # Quantize to two decimal places
        total = total.quantize(Decimal("0.01"))
        return total


class Transaction(models.Model):
    """
    Single-entry bookkeeping
    """

    date = models.DateTimeField()
    amount = models.DecimalField(max_digits=7, decimal_places=2)
    label = models.CharField(max_length=255)

    objects = TransactionQuerySet.as_manager()

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.date}: {self.amount}"
