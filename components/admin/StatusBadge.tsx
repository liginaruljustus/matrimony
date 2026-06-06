type BadgeType = "user" | "profile" | "verification";

type StatusBadgeProps = {
  status: string;
  type: BadgeType;
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let bgColor = "bg-neutral-100";
  let textColor = "text-text-secondary";

  if (type === "user") {
    switch (status) {
      case "ACTIVE":
        bgColor = "bg-success/10";
        textColor = "text-success";
        break;
      case "SUSPENDED":
        bgColor = "bg-warning/10";
        textColor = "text-warning";
        break;
      case "BANNED":
        bgColor = "bg-error/10";
        textColor = "text-error";
        break;
      case "INACTIVE":
        bgColor = "bg-neutral-100";
        textColor = "text-text-secondary";
        break;
    }
  } else if (type === "profile") {
    switch (status) {
      case "DRAFT":
        bgColor = "bg-neutral-100";
        textColor = "text-text-secondary";
        break;
      case "PENDING_APPROVAL":
        bgColor = "bg-info/10";
        textColor = "text-info";
        break;
      case "APPROVED":
        bgColor = "bg-success/10";
        textColor = "text-success";
        break;
      case "REJECTED":
        bgColor = "bg-error/10";
        textColor = "text-error";
        break;
      case "FLAGGED":
        bgColor = "bg-warning/10";
        textColor = "text-warning";
        break;
    }
  } else if (type === "verification") {
    switch (status) {
      case "UNVERIFIED":
      case "PENDING":
        bgColor = "bg-warning/10";
        textColor = "text-warning";
        break;
      case "VERIFIED":
        bgColor = "bg-success/10";
        textColor = "text-success";
        break;
      case "REJECTED":
        bgColor = "bg-error/10";
        textColor = "text-error";
        break;
    }
  }

  const displayText = status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return <span className={`inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-xs font-semibold ${bgColor} ${textColor}`}>{displayText}</span>;
}
