from django.utils import timezone

from fann.artist.finalize_auction import finalize_auction_generate_order
from fann.artist.models import Auction, Event


def sync_all_auction_statuses():
    now = timezone.now()
    counts = {"upcoming_to_live": 0, "live_to_ended": 0}

    # Only pull fields we need
    qs = Auction.objects.filter(status__in=["Upcoming", "Live"])

    for a in qs.iterator(chunk_size=1000):
        new_status = None
        try:

            if a.status == "Upcoming" and a.start_time and now >= a.start_time:
                new_status = "Live"
            elif a.status == "Live" and a.end_time and now >= a.end_time:
                new_status = "Ended"

            if new_status:
                # Atomic per-row update (avoids race if status changed elsewhere)
                auction = Auction.objects.filter(pk=a.pk, status=a.status).last()
                auction.status = new_status
                auction.save()
                if new_status == "Live":
                    counts["upcoming_to_live"] += 1
                else:
                    counts["live_to_ended"] += 1
                    if a.pk:
                        try:
                            finalize_auction_generate_order(a)
                        except Exception:
                            pass
        except Exception:
            pass

    return counts


def sync_all_event_statuses():
    now = timezone.now()
    counts = {"upcoming_to_live": 0, "live_to_ended": 0}

    qs = Event.objects.filter(status__in=["Upcoming", "Live"]).only(
        "id", "status", "start_date", "end_date"
    )
    for e in qs.iterator(chunk_size=1000):
        new_status = None
        try:
            if e.status == "Upcoming" and e.start_date and now >= e.start_date:
                new_status = "Live"
            elif e.status == "Live" and e.end_date and now >= e.end_date:
                new_status = "Ended"

            if not new_status:
                continue

            updated = Event.objects.filter(pk=e.pk, status=e.status).update(
                status=new_status
            )

            if not updated:
                continue

            if new_status == "Live":
                counts["upcoming_to_live"] += 1
            else:
                counts["live_to_ended"] += 1

        except Exception:
            pass

    return counts
