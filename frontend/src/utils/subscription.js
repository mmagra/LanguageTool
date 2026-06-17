// Human-friendly labels for a school's subscription_status.
// Keeps wording consistent across all dashboards (e.g. "trialing" → "Trial").
export const SUBSCRIPTION_LABELS = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    none: 'No Subscription',
};

export const subscriptionLabel = (status) =>
    SUBSCRIPTION_LABELS[status] || SUBSCRIPTION_LABELS.none;

// The TRUE access status of a school, derived from the same rules the backend
// gate (requireSchoolValid) uses. `status` (active/suspended) is the account
// state; access is driven by free_access + valid_until + subscription_status.
// Returns { label, tone } where tone is one of: green | blue | amber | red | gray.
export const getSchoolAccessStatus = (school) => {
    if (!school) return { label: 'Unknown', tone: 'gray' };
    if (school.status && school.status !== 'active') {
        return { label: 'Suspended', tone: 'red' };
    }
    if (school.free_access) return { label: 'Free', tone: 'green' };

    const validUntil = school.valid_until ? new Date(school.valid_until) : null;
    if (!validUntil) return { label: 'Pending', tone: 'amber' };       // never activated / awaiting first payment
    if (validUntil < new Date()) return { label: 'Expired', tone: 'red' };
    if (school.subscription_status === 'trialing') return { label: 'Trial', tone: 'blue' };
    if (school.subscription_status === 'past_due') return { label: 'Past Due', tone: 'amber' };
    return { label: 'Active', tone: 'green' };
};

// Tailwind classes for each tone (badge styling).
export const ACCESS_TONE_CLASSES = {
    green: 'bg-green-50 text-green-700 border-green-100',
    blue:  'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red:   'bg-red-50 text-red-700 border-red-100',
    gray:  'bg-slate-50 text-slate-600 border-slate-200',
};
