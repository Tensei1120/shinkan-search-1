import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CalendarDays, MapPin, Users, Mail, Globe,
  Twitter, Instagram, Youtube, MessageCircle,
} from "lucide-react";

export const revalidate = 60;

export default async function CirclePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createClient();

  const [{ data: circle }, { data: events }] = await Promise.all([
    supabase.from("circles").select("*").eq("id", circleId).single(),
    supabase
      .from("events")
      .select("*")
      .eq("circle_id", circleId)
      .neq("status", "cancelled")
      .gte("date", new Date().toISOString())
      .order("date"),
  ]);

  if (!circle) notFound();

  const catColor = CATEGORY_COLORS[circle.category] ?? CATEGORY_COLORS.other;
  const catLabel = CATEGORIES[circle.category as keyof typeof CATEGORIES] ?? circle.category;

  const infoItems = [
    circle.member_count != null && { label: "部員数", value: `${circle.member_count}人` },
    circle.admission_fee != null && { label: "入会金", value: `${Number(circle.admission_fee).toLocaleString()}円` },
    circle.annual_fee != null && { label: "年会費", value: `${Number(circle.annual_fee).toLocaleString()}円` },
    circle.activity_frequency && { label: "活動頻度", value: circle.activity_frequency },
    circle.gender_ratio && { label: "男女比", value: circle.gender_ratio },
  ].filter(Boolean) as { label: string; value: string }[];

  const snsLinks = [
    circle.twitter_url && { href: circle.twitter_url, Icon: Twitter, label: "Twitter" },
    circle.instagram_url && { href: circle.instagram_url, Icon: Instagram, label: "Instagram" },
    circle.youtube_url && { href: circle.youtube_url, Icon: Youtube, label: "YouTube" },
    circle.line_url && { href: circle.line_url, Icon: MessageCircle, label: "LINE" },
    circle.website_url && { href: circle.website_url, Icon: Globe, label: "Web" },
  ].filter(Boolean) as { href: string; Icon: React.ElementType; label: string }[];

  const genreTags = circle.genre
    ? (circle.genre as string).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/circles"
          className="text-sm text-muted-foreground hover:underline mb-6 inline-block"
        >
          ← 団体一覧に戻る
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-6">
          {circle.logo_url ? (
            <img
              src={circle.logo_url}
              alt={circle.name}
              className="size-20 rounded-xl object-cover border shrink-0"
            />
          ) : (
            <div className="size-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-3xl font-bold text-primary">
              {circle.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
              {circle.university && (
                <span className="text-sm text-muted-foreground">{circle.university}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-snug">{circle.name}</h1>
            {circle.contact_email && (
              <a
                href={`mailto:${circle.contact_email}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-1"
              >
                <Mail className="size-3.5 shrink-0" />
                {circle.contact_email}
              </a>
            )}
          </div>
        </div>

        {/* SNS links */}
        {snsLinks.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            {snsLinks.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
        )}

        {/* Info grid */}
        {infoItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {infoItems.map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-lg px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Genre tags */}
        {genreTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {genreTags.map((tag) => (
              <span key={tag} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {circle.description && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">活動について</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {circle.description}
            </p>
          </section>
        )}

        {/* Events */}
        <section>
          <h2 className="text-lg font-semibold mb-4">開催予定のイベント</h2>

          {!events || events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl">
              <p className="text-3xl mb-2">📅</p>
              <p>現在募集中のイベントはありません。</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {events.map((event) => {
                const isFull = event.reserved_count >= event.capacity;
                const isClosed = event.status === "closed";
                const unavailable = isFull || isClosed;
                const remaining = event.capacity - event.reserved_count;

                return (
                  <div
                    key={event.id}
                    className="border rounded-xl p-5 flex flex-col gap-3 bg-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base leading-snug">{event.title}</h3>
                      {unavailable ? (
                        <Badge variant="secondary" className="shrink-0">受付終了</Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Users className="size-3.5" />
                          残り <strong className="text-foreground">{remaining}</strong> 席
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {format(new Date(event.date), "M月d日(E) HH:mm", { locale: ja })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                        {event.description}
                      </p>
                    )}

                    {unavailable ? (
                      <span className={buttonVariants({ variant: "secondary" }) + " opacity-50 cursor-not-allowed w-full sm:w-auto text-center"}>
                        受付終了
                      </span>
                    ) : (
                      <Link
                        href={`/circles/${circleId}/events/${event.id}`}
                        className={buttonVariants() + " w-full sm:w-auto text-center"}
                      >
                        予約する
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
