import { Link } from 'react-router';
import {
  Search,
  Grid,
  Music,
  Smile,
  Briefcase,
  Laptop,
  Palette,
  Trophy,
  Utensils,
  Star,
  Ticket,
  Users,
  Shield,
  ChevronDown,
  Heart,
  MapPin,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const carouselImages = [
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1501281668745-f7f5792d7cbb?w=1600&h=900&fit=crop',
];

const categories = [
  { icon: Grid, name: 'All Events' },
  { icon: Music, name: 'Music' },
  { icon: Smile, name: 'Comedy' },
  { icon: Briefcase, name: 'Workshops' },
  { icon: Laptop, name: 'Tech & Business' },
  { icon: Palette, name: 'Art & Culture' },
  { icon: Trophy, name: 'Sports' },
  { icon: Utensils, name: 'Food & Drinks' },
];

const trendingEvents = [
  {
    id: 1,
    title: 'Arijit Singh Live',
    date: '24 OCT',
    location: 'Chennai Stadium',
    price: 'From ₹1,499',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=450&fit=crop',
  },
  {
    id: 2,
    title: 'Comedy Night Special',
    date: '28 OCT',
    location: 'Phoenix Arena',
    price: 'From ₹599',
    image:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=450&fit=crop',
  },
  {
    id: 3,
    title: 'Tech Summit 2026',
    date: '02 NOV',
    location: 'Convention Center',
    price: 'From ₹2,999',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=450&fit=crop',
  },
  {
    id: 4,
    title: 'Food Festival',
    date: '05 NOV',
    location: 'Marina Beach',
    price: 'From ₹299',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop',
  },
];

const popularEvents = [
  {
    id: 1,
    title: 'Coldplay Tribute Band',
    date: '10 NOV',
    location: 'Music Academy',
    price: 'From ₹899',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=450&fit=crop',
  },
  {
    id: 2,
    title: 'Photography Workshop',
    date: '12 NOV',
    location: 'Art Gallery',
    price: 'From ₹1,199',
    image:
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=450&fit=crop',
  },
  {
    id: 3,
    title: 'AI & Future of Work',
    date: '15 NOV',
    location: 'Tech Park',
    price: 'From ₹1,499',
    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=450&fit=crop',
  },
  {
    id: 4,
    title: 'Paint & Sip Evening',
    date: '18 NOV',
    location: 'Studio 88',
    price: 'From ₹699',
    image:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=450&fit=crop',
  },
];

const features = [
  {
    icon: Star,
    title: 'Curated Events',
    description: 'Handpicked experiences just for you',
  },
  {
    icon: Ticket,
    title: 'Easy Booking',
    description: 'Fast, secure and hassle-free',
  },
  {
    icon: Users,
    title: 'Vibrant Community',
    description: 'Meet people with similar interests',
  },
  {
    icon: Shield,
    title: 'Trusted Platform',
    description: 'Your safety and happiness come first',
  },
];

function EventCard({ event }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-950/30">
      <div className="relative h-44 overflow-hidden sm:h-40 lg:h-44">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <span className="absolute bottom-3 left-3 rounded-md bg-gray-950/90 px-2.5 py-1.5 text-xs font-medium text-white">
          {event.date}
        </span>

        <button
          type="button"
          aria-label={`Add ${event.title} to favorites`}
          className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-purple-600"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3.5">
        <h3 className="mb-2 truncate text-sm font-semibold text-white sm:text-base">
          {event.title}
        </h3>

        <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-800 pt-3">
          <span className="text-sm font-semibold text-white">
            {event.price}
          </span>

          <Link
            to="/signup"
            className="shrink-0 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-500"
          >
            Book Now →
          </Link>
        </div>
      </div>
    </article>
  );
}

function EventSection({ title, events }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>

        <Link
          to="/events"
          className="flex shrink-0 items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
        >
          See All
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

const Landing = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All Events');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (previous) => (previous + 1) % carouselImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-[72px] items-center justify-between gap-5">
            <Link to="/" className="shrink-0 text-2xl font-bold tracking-tight">
              Event<span className="text-purple-500">Hub</span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              <Link
                to="/events"
                className="text-sm text-white transition-colors hover:text-purple-400"
              >
                Events
              </Link>
              <Link
                to="/events"
                className="text-sm text-gray-300 transition-colors hover:text-purple-400"
              >
                Experiences
              </Link>
              <Link
                to="/events"
                className="text-sm text-gray-300 transition-colors hover:text-purple-400"
              >
                Online Events
              </Link>
              <Link
                to="/organize"
                className="text-sm text-gray-300 transition-colors hover:text-purple-400"
              >
                Organize
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 md:flex">
                <Search className="h-4 w-4 text-gray-400" />
                <span>Find events</span>
              </div>

              <Link
                to="/login"
                className="hidden text-sm text-gray-300 transition-colors hover:text-white sm:block"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-600/20"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Carousel */}
        <section className="relative h-[420px] overflow-hidden sm:h-[480px] lg:h-[510px]">
          {carouselImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt="Live event"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="mb-5 text-xs font-semibold tracking-[0.22em] text-purple-400 sm:text-sm">
                LIVE EVENTS · WORKSHOPS · EXPERIENCES
              </p>

              <h1 className="mb-5 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Discover Extraordinary
                <span className="mt-1 block text-purple-500">
                  Events Near You
                </span>
              </h1>

              <p className="mb-7 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
                From concerts and comedy shows to workshops and festivals — find
                events that match your vibe.
              </p>

              <Link
                to="/events"
                className="inline-flex items-center gap-3 rounded-lg bg-purple-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-600/30"
              >
                Explore Events →
              </Link>
            </div>
          </div>

          <div className="absolute bottom-5 right-5 flex gap-2 sm:right-8">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show hero image ${index + 1}`}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'w-7 bg-purple-500'
                    : 'w-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 pb-5 pt-7 sm:px-6 sm:pt-8">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8 lg:gap-5">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              const isActive = activeCategory === category.name;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategory(category.name)}
                  aria-pressed={isActive}
                  className={`group flex min-w-0 flex-col items-center justify-center gap-3 rounded-xl border px-1.5 py-4 transition-all duration-300 hover:-translate-y-1 sm:px-2 sm:py-5 ${
                    isActive
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-purple-500/50 hover:bg-gray-800'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-gray-800 text-gray-400 group-hover:text-purple-400'
                    }`}
                  >
                    <CategoryIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>

                  <span
                    className={`text-center text-[10px] leading-tight sm:text-xs ${
                      isActive ? 'font-semibold text-white' : 'text-gray-400'
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Trending Events */}
        <EventSection title="Trending Events" events={trendingEvents} />

        {/* Festival Banner */}
        <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950 via-purple-800 to-indigo-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(168,85,247,0.35),transparent_60%)]" />

            <div className="relative flex flex-col items-start justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:px-10 lg:py-9">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-purple-300">
                  DON'T MISS THE EXPERIENCE
                </p>

                <h2 className="mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl">
                  Your Next Festival Awaits
                </h2>

                <p className="text-sm text-purple-100">
                  Music · Food · Art · Lifestyle
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs tracking-widest text-purple-200">
                  UPCOMING FESTIVAL
                </p>
                <p className="text-lg font-bold sm:text-xl">
                  FESTIVAL EXPERIENCE
                </p>
                <p className="mt-1 text-sm text-purple-200">
                  Chennai · October 2026
                </p>
              </div>

              <Link
                to="/events"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-purple-700 transition-transform hover:scale-105"
              >
                Explore Now →
              </Link>
            </div>
          </div>
        </section>

        {/* Popular Events */}
        <EventSection title="Popular in Chennai" events={popularEvents} />

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:gap-5">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className={`flex items-center gap-4 px-2 py-4 lg:px-4 ${
                    index !== features.length - 1
                      ? 'lg:border-r lg:border-gray-800'
                      : ''
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                    <FeatureIcon className="h-6 w-6" />
                  </span>

                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-5 text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-gray-800 bg-gray-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center text-xs text-gray-500 sm:flex-row sm:px-6 sm:text-left">
          <Link to="/" className="text-lg font-bold text-white">
            Event<span className="text-purple-500">Hub</span>
          </Link>

          <p>© {new Date().getFullYear()} EventHub. All rights reserved.</p>

          <div className="flex gap-5">
            <Link to="/events" className="transition-colors hover:text-white">
              Explore
            </Link>
            <Link to="/organize" className="transition-colors hover:text-white">
              Organize
            </Link>
            <Link to="/login" className="transition-colors hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
