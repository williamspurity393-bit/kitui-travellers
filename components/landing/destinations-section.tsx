import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight, MapPin, Star, TreePine } from "lucide-react";

export const ALL_DESTINATIONS = [
  {
    id: 1,
    slug: "nzambani-rock",
    name: "Nzambani Rock",
    location: "Kitui",
    tag: "Landmark",
    accent: "#F97316",
    image:
      "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&q=80&auto=format&fit=crop",
    rating: 4.8,
    blurb:
      "A towering inselberg rising from the plains — 360° panoramic views and deep Kamba legend.",
    highlights: ["Panoramic views", "Kamba legend", "Photography"],
    bestTime: "Jun – Oct",
    description:
      "Nzambani Rock, locally known as Ivia ya Nzambani, stands approximately 183 metres above the surrounding plains just 8 km south of Kitui town. A metallic staircase lets visitors climb to the summit for a full 360° view across Kitui County. The rock is steeped in Kamba oral tradition — most famously the legend that circling it seven times will change one's gender.",
    howToGet:
      "8 km south of Kitui town on the B7 Kitui–Ikutha–Kibwezi road. Reachable by matatu from Kitui bus stage or private car.",
    tips: [
      "Go early morning for cooler temperatures and best light",
      "Bring sturdy footwear for the staircase",
      "On-site guides share cultural stories — worth engaging them",
    ],
  },
  {
    id: 2,
    slug: "mwingi-national-reserve",
    name: "Mwingi Reserve",
    location: "Mwingi",
    tag: "Wildlife",
    accent: "#34d399",
    image:
      "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80&auto=format&fit=crop",
    rating: 4.7,
    blurb: "Spot elephants, rare Grevy's zebras, and lions in one of Kenya's quieter reserves.",
    highlights: ["Elephants", "Grevy's zebras", "Big cats"],
    bestTime: "Jul – Sep",
    description:
      "Mwingi National Reserve is a largely undiscovered wildlife sanctuary in Kitui County. Far less commercialised than the Masai Mara circuit, it protects elephants, lions, leopards, and the endangered Grevy's zebra across dry acacia woodland and rocky terrain. The Tana River forms its eastern boundary.",
    howToGet:
      "About 90 km north of Kitui town on the B8 highway towards Mwingi town. Accessible by bus to Mwingi, then matatu or taxi to the reserve.",
    tips: [
      "Self-drive in a 4WD recommended inside the reserve",
      "Book a community guide from Mwingi town for best wildlife sightings",
      "The dry season (Jul–Sep) concentrates animals around water sources",
    ],
  },
  {
    id: 3,
    slug: "kyangwithya-hills",
    name: "Kyangwithya Hills",
    location: "Kitui",
    tag: "Hiking",
    accent: "#60a5fa",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80&auto=format&fit=crop",
    rating: 4.6,
    blurb:
      "Off-the-radar ridgeline with sweeping semi-arid panoramas. Best experienced at sunrise.",
    highlights: ["Sunrise hike", "Semi-arid views", "Quiet trails"],
    bestTime: "Jun – Sep",
    description:
      "Kyangwithya Hills rise above Kitui town and offer one of the most rewarding sunrise hikes in Eastern Kenya. The ridgeline is free of crowds and gives sweeping views over the semi-arid Kitui plains, dotted with acacia and commiphora scrubland. A favourite for trail runners and photographers.",
    howToGet:
      "Reachable from Kitui town centre — local boda-boda riders can take you to the trailhead. Ask at your guesthouse for directions.",
    tips: [
      "Start before 6 AM to catch sunrise from the summit",
      "Carry 2+ litres of water — no water points on the trail",
      "Wear long sleeves in the morning; it can be cool at elevation",
    ],
  },
  {
    id: 4,
    slug: "kitui-central-market",
    name: "Kitui Central Market",
    location: "Kitui Town",
    tag: "Culture",
    accent: "#fb923c",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80&auto=format&fit=crop",
    rating: 4.5,
    blurb: "The beating heart of Kitui — fresh produce, hand-carved Kamba crafts, and street food.",
    highlights: ["Kamba crafts", "Street food", "Local life"],
    bestTime: "Year-round",
    description:
      "Kitui Central Market is the social and commercial heart of the town. Vendors sell everything from fresh fruits and vegetables to hand-carved Kamba stools, beadwork, and woven baskets. The aroma of nyama choma and chai fills the air. The market is busiest in the morning and a perfect spot to experience everyday Kitui life.",
    howToGet:
      "Walking distance from most guesthouses in Kitui town centre. Located near the main bus stage.",
    tips: [
      "Go between 7–11 AM for peak activity and freshest produce",
      "Negotiate prices respectfully — it's expected",
      "Try the street ugali and sukuma wiki for under KES 100",
    ],
  },
  {
    id: 5,
    slug: "ithumba-hills",
    name: "Ithumba Hills",
    location: "Kitui",
    tag: "Birdwatching",
    accent: "#2dd4bf",
    image:
      "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800&q=80&auto=format&fit=crop",
    rating: 4.6,
    blurb:
      "Over 200 bird species recorded across the hills — a birder's paradise in the semi-arid.",
    highlights: ["200+ species", "Scenic trails", "Photography"],
    bestTime: "Nov – Jan",
    description:
      "Ithumba Hills in Kitui County is one of the most rewarding birdwatching sites in Eastern Kenya. Over 200 species have been recorded here, including several dry-country specialists rarely seen elsewhere. The surrounding rocky terrain and acacia woodland also provide excellent scenic hiking with minimal foot traffic.",
    howToGet:
      "Accessible by matatu or car from Kitui town. The hills are roughly 45 km north of Kitui. Ask locally for the Ithumba trading centre as a landmark.",
    tips: [
      "November to January is peak season when Palearctic migrants arrive",
      "Bring binoculars and a bird field guide for Eastern Africa",
      "Visit at dawn — birds are most active in the first two hours of daylight",
    ],
  },
  {
    id: 6,
    slug: "south-kitui-national-reserve",
    name: "South Kitui Reserve",
    location: "South Kitui",
    tag: "Wildlife",
    accent: "#34d399",
    image:
      "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=800&q=80&auto=format&fit=crop",
    rating: 4.5,
    blurb: "A remote, protected acacia savanna — lions, leopards, and unspoilt wilderness.",
    highlights: ["Big cats", "Acacia savanna", "Remote"],
    bestTime: "Jul – Oct",
    description:
      "South Kitui National Reserve protects a vast stretch of dry acacia savanna in the southern part of Kitui County. It is genuinely remote — free of tourist lodges and commercialisation — making it ideal for adventurous travellers seeking undisturbed wildlife encounters. Lions, leopards, elephants, and abundant birdlife inhabit the reserve.",
    howToGet:
      "Accessed via the Kibwezi–Kitui road (B7). A 4WD vehicle is essential inside the reserve. Nearest town is Mutomo, from which local guides can be arranged.",
    tips: [
      "Only visit with a local guide — the reserve has no formal infrastructure",
      "Carry all food, water, and supplies from Mutomo or Kitui",
      "Camping inside the reserve is a unique experience — check KWS permits",
    ],
  },
  {
    id: 7,
    slug: "gai-rock-kyuso",
    name: "Gai Rock",
    location: "Kyuso",
    tag: "Landmark",
    accent: "#fbbf24",
    image:
      "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=800&q=80&auto=format&fit=crop",
    rating: 4.4,
    blurb: "A geologically and culturally significant rock at the centre of Kamba oral history.",
    highlights: ["Kamba heritage", "Geology", "Day trip"],
    bestTime: "Jun – Sep",
    description:
      "Gai Rock (also called Muruu Rock) near Kyuso town is a culturally important geological formation deeply embedded in Kamba oral tradition. Like Nzambani Rock, it has been a site of community gatherings and spiritual significance for generations. The surrounding landscape offers quiet scenic walks with views over the Tana River plains.",
    howToGet:
      "Located near Kyuso town, approximately 120 km north of Kitui town. Accessible by bus to Kyuso from Mwingi or Kitui.",
    tips: [
      "Combine with a visit to Mwingi National Reserve for a full day trip",
      "Local elders in Kyuso can share the oral history of the rock",
      "The site is quiet and rarely visited — you may have it to yourself",
    ],
  },
  {
    id: 8,
    slug: "mutomo-hills",
    name: "Mutomo Hills",
    location: "Mutomo",
    tag: "Hiking",
    accent: "#818cf8",
    image:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&auto=format&fit=crop",
    rating: 4.5,
    blurb: "Rocky escarpments and dry-country flora with far-reaching views over the plains.",
    highlights: ["Rock scrambles", "Dry flora", "Views"],
    bestTime: "Jun – Sep",
    description:
      "Mutomo Hills in southern Kitui offer excellent hiking through rocky escarpments covered in dry-country flora — commiphora, aloe, and succulents. The hills overlook the vast flat plains extending towards South Kitui National Reserve. Mutomo town itself has the nearby Mutomo Hill Sanctuary and Reptile Park.",
    howToGet:
      "Mutomo town is on the B7 Kibwezi–Kitui road, approximately 80 km south of Kitui town. Accessible by bus from both Kitui and Nairobi via Kibwezi.",
    tips: [
      "The Mutomo Reptile Park nearby is worth combining for a half-day",
      "Carry plenty of water — shade is scarce on the higher sections",
      "Sunrise and late afternoon give the best light for photography",
    ],
  },
];

const PREVIEW = ALL_DESTINATIONS.slice(0, 6);

const TAG_STYLES: Record<string, string> = {
  Landmark: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  Wildlife: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  Hiking: "bg-blue-400/15 text-blue-300 ring-blue-400/30",
  Culture: "bg-orange-400/15 text-orange-300 ring-orange-400/30",
  Birdwatching: "bg-teal-400/15 text-teal-300 ring-teal-400/30",
};

function DestCard({ dest }: { dest: (typeof ALL_DESTINATIONS)[0] }) {
  const tagStyle = TAG_STYLES[dest.tag] ?? "bg-primary/15 text-primary ring-primary/30";

  return (
    <Link
      href={`/destinations/${dest.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <Image
          src={dest.image}
          alt={dest.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        {/* Tag pill */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 backdrop-blur-sm ${tagStyle}`}
          >
            {dest.tag}
          </span>
        </div>
        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full px-2.5 py-1">
          <Star className="size-2.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{dest.rating}</span>
        </div>
        {/* Accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-70"
          style={{ backgroundColor: dest.accent }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="size-3 shrink-0" style={{ color: dest.accent }} />
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            {dest.location}
          </span>
        </div>
        <h3
          className="text-lg font-black text-foreground leading-tight mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {dest.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2 mb-4">
          {dest.blurb}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div>
            <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-wider mb-0.5">
              Best time
            </p>
            <p className="text-xs font-semibold text-foreground">{dest.bestTime}</p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {dest.highlights.slice(0, 2).map((h) => (
              <span
                key={h}
                className="text-[9px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200"
          style={{ color: dest.accent }}
        >
          Explore <ArrowRight className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}

export function DestinationsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="text-[10px] sm:text-xs text-primary font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TreePine className="size-3" /> Top Destination
            </p>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Explore Kitui &amp; Beyond
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Natural wonders, cultural gems, and wildlife reserves across Eastern Kenya.
            </p>
          </div>
          <Link
            href="/destinations"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all duration-200 shrink-0"
          >
            See all destinations <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PREVIEW.map((dest) => (
            <DestCard key={dest.id} dest={dest} />
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-primary/30 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            See all destinations <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
