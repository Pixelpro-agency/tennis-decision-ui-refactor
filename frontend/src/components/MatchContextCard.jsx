import { buildMatchContextViewModel } from './matchContextViewModel.js';

function Thermometer({ title, homeName, awayName, homePct, awayPct }) {
    const label = `${title}: ${homeName} ${homePct}%, ${awayName} ${awayPct}%`;

    return (
        <div className="mt-4" role="img" aria-label={label}>
            <div
                className="flex h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
                aria-hidden="true"
            >
                <div className="h-full bg-[var(--accent-blue)]" style={{ width: `${homePct}%` }} />
                <div className="h-full bg-[var(--muted)] opacity-80" style={{ width: `${awayPct}%` }} />
            </div>
        </div>
    );
}

function PointShareSection({ section }) {
    return (
        <section className="border-t border-[var(--card-border)] pt-5 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-semibold text-white">{section.title}</h3>

            {section.available ? (
                <>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="min-w-0">
                            <p className="truncate font-medium text-white" title={section.homeName}>
                                {section.homeName}
                            </p>
                            <p className="mt-1 text-[var(--muted)]">
                                {section.homePctLabel}{' \u00b7 '}{section.homePointsLabel}
                            </p>
                        </div>
                        <div className="min-w-0 text-right">
                            <p className="truncate font-medium text-white" title={section.awayName}>
                                {section.awayName}
                            </p>
                            <p className="mt-1 text-[var(--muted)]">
                                {section.awayPctLabel}{' \u00b7 '}{section.awayPointsLabel}
                            </p>
                        </div>
                    </div>

                    <Thermometer
                        title={section.title}
                        homeName={section.homeName}
                        awayName={section.awayName}
                        homePct={section.homePct}
                        awayPct={section.awayPct}
                    />

                    {section.subtitle && (
                        <p className="mt-3 text-xs text-[var(--muted)]">{section.subtitle}</p>
                    )}
                </>
            ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{section.message}</p>
            )}
        </section>
    );
}

export default function MatchContextCard({ localContext, players }) {
    const viewModel = buildMatchContextViewModel(localContext, players);

    return (
        <div className="dashboardCard p-6 flex flex-col h-full min-h-[400px]">
            <div className="mb-6">
                <h2 className="text-[12px] font-bold tracking-widest text-[var(--muted)]">
                    Contesto punti
                </h2>
                <p className="mt-2 text-xs text-[var(--muted)]">
                    Calcolato localmente dai dati disponibili
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <PointShareSection section={viewModel.match} />
                <PointShareSection section={viewModel.recent} />

                {viewModel.comparison.available && (
                    <section className="border-t border-[var(--card-border)] pt-5">
                        <h3 className="text-sm font-semibold text-white">
                            {viewModel.comparison.title}
                        </h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="min-w-0 truncate text-[var(--muted)]">
                                    {viewModel.comparison.homeName}
                                </dt>
                                <dd className="shrink-0 text-white">
                                    {viewModel.comparison.homeDeltaLabel}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="min-w-0 truncate text-[var(--muted)]">
                                    {viewModel.comparison.awayName}
                                </dt>
                                <dd className="shrink-0 text-white">
                                    {viewModel.comparison.awayDeltaLabel}
                                </dd>
                            </div>
                        </dl>
                        {viewModel.comparison.observedDifferenceText && (
                            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                                {viewModel.comparison.observedDifferenceText}
                            </p>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
