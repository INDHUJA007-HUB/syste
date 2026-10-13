import { PrismaClient, Role, PlanTier, PlanInterval, SubscriptionStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StreamSphere database seeding...');

  // 1. Clean existing records in correct relation order
  await prisma.viewingEvent.deleteMany();
  await prisma.playbackSession.deleteMany();
  await prisma.playbackProgress.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.videoGenre.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.video.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Subscription Plans
  console.log('📦 Creating subscription plans...');
  const planFree = await prisma.subscriptionPlan.create({
    data: {
      name: 'StreamSphere Free',
      slug: 'free',
      description: 'Enjoy a curated selection of free titles in standard definition with ad support.',
      priceCents: 0,
      currency: 'USD',
      billingInterval: PlanInterval.MONTHLY,
      maxResolution: '480p',
      maxScreens: 1,
      tierLevel: 0,
      tierName: PlanTier.FREE,
      features: JSON.stringify([
        'Access to free catalogue titles',
        'Standard definition (480p)',
        '1 simultaneous stream',
        'Watch on mobile & web',
      ]),
      isActive: true,
    },
  });

  const planBasic = await prisma.subscriptionPlan.create({
    data: {
      name: 'StreamSphere Basic',
      slug: 'basic',
      description: 'Stream our core entertainment catalogue in crisp 720p HD with no commercials.',
      priceCents: 799,
      currency: 'USD',
      billingInterval: PlanInterval.MONTHLY,
      maxResolution: '720p',
      maxScreens: 1,
      tierLevel: 1,
      tierName: PlanTier.BASIC,
      features: JSON.stringify([
        'Unlimited access to Basic & Free movies',
        'High Definition (720p)',
        '1 stream at a time',
        'Completely ad-free experience',
        'Phone, tablet, and TV app access',
      ]),
      isActive: true,
    },
  });

  const planStandard = await prisma.subscriptionPlan.create({
    data: {
      name: 'StreamSphere Standard',
      slug: 'standard',
      description: 'Full HD streaming on up to 2 devices simultaneously. Ideal for couples & small households.',
      priceCents: 1299,
      currency: 'USD',
      billingInterval: PlanInterval.MONTHLY,
      maxResolution: '1080p',
      maxScreens: 2,
      tierLevel: 2,
      tierName: PlanTier.STANDARD,
      features: JSON.stringify([
        'Unlimited access to Standard, Basic & Free titles',
        'Full HD (1080p) streaming',
        '2 simultaneous streams',
        'Offline mobile downloads',
        'Stereo 5.1 surround sound',
      ]),
      isActive: true,
    },
  });

  const planPremium = await prisma.subscriptionPlan.create({
    data: {
      name: 'StreamSphere Premium',
      slug: 'premium',
      description: 'The ultimate cinematic experience with 4K HDR, Dolby Atmos spatial audio, and 4 concurrent streams.',
      priceCents: 1799,
      currency: 'USD',
      billingInterval: PlanInterval.MONTHLY,
      maxResolution: '4K',
      maxScreens: 4,
      tierLevel: 3,
      tierName: PlanTier.PREMIUM,
      features: JSON.stringify([
        'Complete VIP library including 4K Premieres',
        'Ultra HD 4K + HDR10 / Dolby Vision',
        'Spatial Audio / Dolby Atmos',
        '4 simultaneous streams',
        'Offline downloads on up to 6 devices',
        'Early access to new releases',
      ]),
      isActive: true,
    },
  });

  // 3. Create Users
  console.log('👤 Creating demo accounts...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@streamsphere.com',
      passwordHash: adminPassword,
      name: 'Alex Rivers (Admin)',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sarahUser = await prisma.user.create({
    data: {
      email: 'sarah@streamsphere.com',
      passwordHash: userPassword,
      name: 'Sarah Connor',
      role: Role.USER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const johnUser = await prisma.user.create({
    data: {
      email: 'john@streamsphere.com',
      passwordHash: userPassword,
      name: 'John Doe',
      role: Role.USER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const emmaUser = await prisma.user.create({
    data: {
      email: 'emma@streamsphere.com',
      passwordHash: userPassword,
      name: 'Emma Watson',
      role: Role.USER,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 4. Create Active Subscriptions for demo users
  console.log('💳 Creating subscriptions...');
  const now = new Date();
  const oneMonthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Sarah has active Premium
  const sarahSub = await prisma.subscription.create({
    data: {
      userId: sarahUser.id,
      planId: planPremium.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthAhead,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.payment.create({
    data: {
      userId: sarahUser.id,
      subscriptionId: sarahSub.id,
      amountCents: 1799,
      currency: 'USD',
      status: PaymentStatus.SUCCEEDED,
      paymentMethod: 'card_visa_4242',
      idempotencyKey: 'seed_idem_sarah_001',
      externalTransactionId: 'txn_mock_seed_sarah_prem_01',
    },
  });

  // John has active Basic
  const johnSub = await prisma.subscription.create({
    data: {
      userId: johnUser.id,
      planId: planBasic.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthAhead,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.payment.create({
    data: {
      userId: johnUser.id,
      subscriptionId: johnSub.id,
      amountCents: 799,
      currency: 'USD',
      status: PaymentStatus.SUCCEEDED,
      paymentMethod: 'card_mastercard_5555',
      idempotencyKey: 'seed_idem_john_001',
      externalTransactionId: 'txn_mock_seed_john_basic_01',
    },
  });

  // Emma has Free plan subscription
  await prisma.subscription.create({
    data: {
      userId: emmaUser.id,
      planId: planFree.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthAhead,
    },
  });

  // 5. Create Genres
  console.log('🎭 Creating genres...');
  const genreList = [
    { name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic science, space exploration, and time travel.' },
    { name: 'Action', slug: 'action', description: 'High-octane excitement, battles, and daring stunts.' },
    { name: 'Animation', slug: 'animation', description: 'Masterful CGI, hand-drawn art, and visual wonder.' },
    { name: 'Drama', slug: 'drama', description: 'Emotionally resonant, character-driven narratives.' },
    { name: 'Fantasy', slug: 'fantasy', description: 'Mythical realms, magic, and epic quests.' },
    { name: 'Thriller', slug: 'thriller', description: 'Suspenseful plots, high stakes, and psychological twists.' },
    { name: 'Documentary', slug: 'documentary', description: 'Factual real-world chronicles and inspiring stories.' },
    { name: 'Cyberpunk', slug: 'cyberpunk', description: 'High-tech and low-life dystopian landscapes.' },
    { name: 'Comedy', slug: 'comedy', description: 'Witty banter, slapstick laughs, and feel-good stories.' },
    { name: 'Adventure', slug: 'adventure', description: 'Expeditions into the unknown and uncharted frontiers.' },
  ];

  const genres: Record<string, any> = {};
  for (const g of genreList) {
    genres[g.slug] = await prisma.genre.create({ data: g });
  }

  // 6. Create 24 High Quality Catalogue Videos
  console.log('🎬 Seeding catalogue videos with valid streaming sources...');
  
  // Public domain & Creative Commons movie assets with valid streaming endpoints
  const videosData = [
    {
      title: 'Tears of Steel',
      slug: 'tears-of-steel',
      description: 'In a dystopian future, a group of scientists and warriors assemble at the Oude Kerk in Amsterdam to stage a crucial timeline event and save humanity from rampaging combat robots.',
      posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 734,
      releaseYear: 2024,
      maturityRating: 'PG-13',
      rating: 8.9,
      isFeatured: true,
      isTrending: true,
      viewCount: 142500,
      director: 'Ian Hubert',
      cast: 'Derek de Lint, Sergio Hasselbaink, Rogier Schippers, Vanja Rukavina',
      minimumPlanTier: PlanTier.FREE,
      genres: ['sci-fi', 'action', 'cyberpunk'],
    },
    {
      title: 'Cosmos Laundromat: First Cycle',
      slug: 'cosmos-laundromat',
      description: 'On a desolate, wind-swept island, a suicidal sheep named Franck meets a mysterious salesman named Victor, who offers him the gift of experiencing all possible parallel lives.',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 721,
      releaseYear: 2023,
      maturityRating: 'TV-MA',
      rating: 9.1,
      isFeatured: true,
      isTrending: true,
      viewCount: 98400,
      director: 'Mathieu Auvray',
      cast: 'Pierre Bokma, Reinout Scholten van Aschat',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['animation', 'fantasy', 'drama'],
    },
    {
      title: 'Sintel: The Dragon Hunter',
      slug: 'sintel',
      description: 'A lonely, resilient young woman named Sintel rescues a wounded baby dragon, forming an unbreakable bond. When an adult dragon abducts him, she undertakes a perilous trek across treacherous snowy peaks.',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 888,
      releaseYear: 2022,
      maturityRating: 'PG-13',
      rating: 8.7,
      isFeatured: false,
      isTrending: true,
      viewCount: 231000,
      director: 'Colin Levy',
      cast: 'Halina Reijn, Thom Hoffman',
      minimumPlanTier: PlanTier.FREE,
      genres: ['animation', 'fantasy', 'adventure'],
    },
    {
      title: 'Elephants Dream: The Machine',
      slug: 'elephants-dream',
      description: 'Two explorers wander through an endless, labyrinthine living computational megastructure. While older Emo believes it to be organic, young Proog insists it is purely mechanical.',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 654,
      releaseYear: 2021,
      maturityRating: 'PG',
      rating: 8.2,
      isFeatured: false,
      isTrending: false,
      viewCount: 84300,
      director: 'Bassam Kurdali',
      cast: 'Tygo Gernandt, Cas Jansen',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['animation', 'sci-fi', 'thriller'],
    },
    {
      title: 'Big Buck Bunny: Meadow Rampage',
      slug: 'big-buck-bunny',
      description: 'A benevolent giant rabbit wakes up on a serene spring morning only to have his peaceful forest day ruined by three bullying rodents. Buck devises a masterclass in woodland engineering for revenge.',
      posterUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 596,
      releaseYear: 2023,
      maturityRating: 'G',
      rating: 8.5,
      isFeatured: false,
      isTrending: true,
      viewCount: 450000,
      director: 'Sacha Goedegebure',
      cast: 'Jan Morgenstern, Ton Roosendaal',
      minimumPlanTier: PlanTier.FREE,
      genres: ['animation', 'comedy', 'adventure'],
    },
    {
      title: 'For Bigger Blazes: Firestorm Protocol',
      slug: 'for-bigger-blazes',
      description: 'Deep within an experimental thermal research station in the Mojave, a cascade event threatens to ignite an unstoppable plasma chain reaction.',
      posterUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2024,
      maturityRating: 'PG-13',
      rating: 8.4,
      isFeatured: false,
      isTrending: true,
      viewCount: 65200,
      director: 'Marcus Sterling',
      cast: 'David Bradley, Helena Shaw',
      minimumPlanTier: PlanTier.STANDARD,
      genres: ['action', 'thriller'],
    },
    {
      title: 'For Bigger Escape: Orbital Breakout',
      slug: 'for-bigger-escape',
      description: 'An elite security specialist trapped aboard a drifting deep-space penitentiary must hack automated defense grids before the orbital decay reaches critical threshold.',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2025,
      maturityRating: 'PG-13',
      rating: 8.8,
      isFeatured: false,
      isTrending: true,
      viewCount: 88100,
      director: 'Elena Rostova',
      cast: 'Cillian Vance, Natasha Cole',
      minimumPlanTier: PlanTier.PREMIUM,
      genres: ['sci-fi', 'action', 'adventure'],
    },
    {
      title: 'Neon Odyssey: Cyber Genesis',
      slug: 'neon-odyssey',
      description: 'In Neo-Kyoto 2099, a neural rogue hacker stumbles upon an encrypted sentience awakening inside the global hyper-grid, pursued by corporate paramilitary assassins.',
      posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 734,
      releaseYear: 2024,
      maturityRating: 'R',
      rating: 9.3,
      isFeatured: true,
      isTrending: true,
      viewCount: 312000,
      director: 'Kenji Takahashi',
      cast: 'Jin Sakai, Maya Lin, Takeshi Kovacs',
      minimumPlanTier: PlanTier.PREMIUM,
      genres: ['cyberpunk', 'sci-fi', 'thriller'],
    },
    {
      title: 'Sub-Zero Abyss: Deep Mariana',
      slug: 'sub-zero-abyss',
      description: 'A subterranean oceanic research crew 11,000 meters beneath sea level encounters bioluminescent leviathans that communicate through seismic soundwaves.',
      posterUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 654,
      releaseYear: 2023,
      maturityRating: 'PG-13',
      rating: 8.6,
      isFeatured: false,
      isTrending: false,
      viewCount: 74200,
      director: 'Chloe Zhang',
      cast: 'Samuel Mercer, Rachel Green, Liam Croft',
      minimumPlanTier: PlanTier.STANDARD,
      genres: ['thriller', 'sci-fi', 'documentary'],
    },
    {
      title: 'Chronicles of Valoria: Dawn of Runes',
      slug: 'chronicles-of-valoria',
      description: 'When the ancient Ley Lines flare across the Northern kingdoms, an exiled apprentice and a dwarven gunsmith must unite hostile clans against an emerging frost wyrm.',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 888,
      releaseYear: 2024,
      maturityRating: 'PG-13',
      rating: 8.8,
      isFeatured: false,
      isTrending: true,
      viewCount: 162000,
      director: 'Lars Mikkelsen',
      cast: 'Freya Allan, Kristofer Hivju, Einar Selvik',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['fantasy', 'adventure', 'action'],
    },
    {
      title: 'Quantum Paradox: The Rift',
      slug: 'quantum-paradox',
      description: 'A particle physicist at CERN inadvertently shifts into an adjacent dimension where the laws of thermodynamic entropy run backwards.',
      posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2023,
      maturityRating: 'PG-13',
      rating: 8.5,
      isFeatured: false,
      isTrending: false,
      viewCount: 51200,
      director: 'Hannah Brooks',
      cast: 'Ethan Hawke, Rebecca Ferguson',
      minimumPlanTier: PlanTier.STANDARD,
      genres: ['sci-fi', 'drama', 'thriller'],
    },
    {
      title: 'Solaris Eclipse: Voyage to Titan',
      slug: 'solaris-eclipse',
      description: 'Humanity’s first interstellar ion-drive expedition encounters an uncharted monolithic sphere suspended within Saturn’s outer rings.',
      posterUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2025,
      maturityRating: 'PG',
      rating: 9.0,
      isFeatured: false,
      isTrending: true,
      viewCount: 198000,
      director: 'Guillermo Vance',
      cast: 'Oscar Isaac, Jessica Chastain',
      minimumPlanTier: PlanTier.PREMIUM,
      genres: ['sci-fi', 'adventure'],
    },
    {
      title: 'Shadow Agent: Protocol Zero',
      slug: 'shadow-agent',
      description: 'Disavowed by every intelligence agency on earth, a rogue operative wages an asymmetric one-man war against an automated algorithmic syndicate.',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 734,
      releaseYear: 2024,
      maturityRating: 'R',
      rating: 8.7,
      isFeatured: false,
      isTrending: false,
      viewCount: 110400,
      director: 'Chadwick Walsh',
      cast: 'Karl Urban, Maggie Q, Hiroyuki Sanada',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['action', 'thriller'],
    },
    {
      title: 'Kingdom of Whispers',
      slug: 'kingdom-of-whispers',
      description: 'Intrigue, poison, and dynastic betrayal tear apart the imperial court of Byzantine Antioch during the catastrophic solar eclipse of 1142.',
      posterUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 888,
      releaseYear: 2022,
      maturityRating: 'TV-MA',
      rating: 8.6,
      isFeatured: false,
      isTrending: false,
      viewCount: 92300,
      director: 'Julian Fellowes',
      cast: 'Claire Foy, Richard Armitage',
      minimumPlanTier: PlanTier.STANDARD,
      genres: ['drama', 'thriller'],
    },
    {
      title: 'The Serengeti Wild: Untamed Earth',
      slug: 'serengeti-wild',
      description: 'Captured with cutting-edge 8K high-speed telephoto lenses, experience the great migration and the raw survival instinct across the African savannah.',
      posterUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 596,
      releaseYear: 2023,
      maturityRating: 'G',
      rating: 9.4,
      isFeatured: false,
      isTrending: true,
      viewCount: 205000,
      director: 'David Attenborough Team',
      cast: 'Sir David Attenborough (Narrator)',
      minimumPlanTier: PlanTier.FREE,
      genres: ['documentary', 'adventure'],
    },
    {
      title: 'Neon Nights: City of Glass',
      slug: 'neon-nights',
      description: 'A detective with a photographic synthetic ocular implant investigates the murder of a high-profile cybernetic engineer in downtown Seattle.',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 734,
      releaseYear: 2024,
      maturityRating: 'R',
      rating: 8.9,
      isFeatured: false,
      isTrending: true,
      viewCount: 184000,
      director: 'Nicolas Winding Refn',
      cast: 'Ryan Gosling, Ana de Armas',
      minimumPlanTier: PlanTier.PREMIUM,
      genres: ['cyberpunk', 'thriller', 'drama'],
    },
    {
      title: 'Ironclad: Siege of Gibraltar',
      slug: 'ironclad-siege',
      description: 'Historical warfare erupts in this visceral recreation of the epic artillery standoff between imperial fleets in the narrow strait.',
      posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2022,
      maturityRating: 'R',
      rating: 8.3,
      isFeatured: false,
      isTrending: false,
      viewCount: 67000,
      director: 'Ridley Scott Studio',
      cast: 'Paul Mescal, Russell Crowe',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['action', 'drama'],
    },
    {
      title: 'The Forest Whisperer',
      slug: 'forest-whisperer',
      description: 'In an ancient Scandinavian fjord, a botanist discovers that mycorrhizal fungal networks possess collective memory dating back hundreds of millenia.',
      posterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 654,
      releaseYear: 2023,
      maturityRating: 'PG',
      rating: 8.4,
      isFeatured: false,
      isTrending: false,
      viewCount: 42100,
      director: 'Ingrid Bergman Jr',
      cast: 'Noomi Rapace, Mads Mikkelsen',
      minimumPlanTier: PlanTier.FREE,
      genres: ['drama', 'fantasy'],
    },
    {
      title: 'Cosmic Horizons: The Black Hole Echoes',
      slug: 'cosmic-horizons',
      description: 'Astronomers utilize the Event Horizon Telescope array to listen to electromagnetic chirp signals emitted during the merger of supermassive singularities.',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2024,
      maturityRating: 'G',
      rating: 9.2,
      isFeatured: false,
      isTrending: true,
      viewCount: 154000,
      director: 'Neil deGrasse Tyson Production',
      cast: 'Kip Thorne, Katie Mack',
      minimumPlanTier: PlanTier.STANDARD,
      genres: ['documentary', 'sci-fi'],
    },
    {
      title: 'Velocity: Street King 9',
      slug: 'velocity-street-king',
      description: 'Underground electric hypercar racing through the high-speed transit tunnels of modern Tokyo, where racers battle over black-market solid-state battery tech.',
      posterUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 90,
      releaseYear: 2024,
      maturityRating: 'PG-13',
      rating: 8.1,
      isFeatured: false,
      isTrending: true,
      viewCount: 220000,
      director: 'Justin Lin',
      cast: 'Sung Kang, Michelle Rodriguez',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['action', 'thriller'],
    },
    {
      title: 'The Last Alchemist',
      slug: 'last-alchemist',
      description: 'In 16th century Prague, an outcast philosopher decodes an encrypted hermetic codex that grants mastery over atomic transmutation.',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 888,
      releaseYear: 2023,
      maturityRating: 'PG-13',
      rating: 8.5,
      isFeatured: false,
      isTrending: false,
      viewCount: 48900,
      director: 'Jan Svankmajer',
      cast: 'Christoph Waltz, Daniel Bruhl',
      minimumPlanTier: PlanTier.FREE,
      genres: ['fantasy', 'drama'],
    },
    {
      title: 'Echoes of the Colosseum',
      slug: 'echoes-of-colosseum',
      description: 'Unprecedented historical excavation beneath Rome uncovers the hydraulic elevator labyrinths that powered the legendary gladiatorial spectacles.',
      posterUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 596,
      releaseYear: 2022,
      maturityRating: 'PG',
      rating: 8.7,
      isFeatured: false,
      isTrending: false,
      viewCount: 71000,
      director: 'Mary Beard',
      cast: 'Mary Beard, Alberto Angela',
      minimumPlanTier: PlanTier.FREE,
      genres: ['documentary', 'drama'],
    },
    {
      title: 'Neon Samurai: Blade of Shinjuku',
      slug: 'neon-samurai',
      description: 'An honor-bound ronin cyber-mercenary protects a genetically engineered child from ruthless corporate syndicates in the neon-soaked alleys of futuristic Tokyo.',
      posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 734,
      releaseYear: 2025,
      maturityRating: 'R',
      rating: 9.2,
      isFeatured: true,
      isTrending: true,
      viewCount: 410000,
      director: 'Shinichiro Watanabe',
      cast: 'Hiroyuki Sanada, Rinko Kikuchi, Ken Watanabe',
      minimumPlanTier: PlanTier.PREMIUM,
      genres: ['action', 'cyberpunk', 'sci-fi'],
    },
    {
      title: 'The Great Arctic Expedition',
      slug: 'great-arctic-expedition',
      description: 'A daring expedition navigates treacherous melting ice floes in search of a lost 19th-century exploration schooner trapped in permafrost.',
      posterUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&auto=format&fit=crop&q=80',
      trailerUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      hlsManifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 654,
      releaseYear: 2023,
      maturityRating: 'PG',
      rating: 8.6,
      isFeatured: false,
      isTrending: false,
      viewCount: 56000,
      director: 'Jared Harris',
      cast: 'Ciaran Hinds, Tobias Menzies',
      minimumPlanTier: PlanTier.BASIC,
      genres: ['adventure', 'documentary'],
    },
  ];

  const createdVideos: any[] = [];

  for (const v of videosData) {
    const { genres: gList, ...vFields } = v;
    const video = await prisma.video.create({
      data: vFields,
    });
    createdVideos.push(video);

    // Link Genres
    for (const gSlug of gList) {
      if (genres[gSlug]) {
        await prisma.videoGenre.create({
          data: {
            videoId: video.id,
            genreId: genres[gSlug].id,
          },
        });
      }
    }

    // Create Renditions / MediaAssets
    await prisma.mediaAsset.createMany({
      data: [
        {
          videoId: video.id,
          quality: '1080p',
          format: 'mp4',
          url: video.videoUrl,
          sizeBytes: BigInt(250000000),
        },
        {
          videoId: video.id,
          quality: '720p',
          format: 'mp4',
          url: video.videoUrl,
          sizeBytes: BigInt(120000000),
        },
        {
          videoId: video.id,
          quality: 'Adaptive HLS',
          format: 'hls',
          url: video.hlsManifestUrl || video.videoUrl,
        },
      ],
    });
  }

  // 7. Seed Watchlist & Continue Watching for Sarah Connor and John Doe
  console.log('📌 Seeding watchlist & playback progress...');
  
  // Sarah's Watchlist
  await prisma.watchlistItem.createMany({
    data: [
      { userId: sarahUser.id, videoId: createdVideos[0].id },
      { userId: sarahUser.id, videoId: createdVideos[1].id },
      { userId: sarahUser.id, videoId: createdVideos[7].id },
    ],
  });

  // Sarah's Continue Watching
  await prisma.playbackProgress.create({
    data: {
      userId: sarahUser.id,
      videoId: createdVideos[0].id,
      positionSeconds: 310,
      durationSeconds: 734,
      completed: false,
      lastWatchedAt: new Date(),
    },
  });

  await prisma.playbackProgress.create({
    data: {
      userId: sarahUser.id,
      videoId: createdVideos[1].id,
      positionSeconds: 450,
      durationSeconds: 721,
      completed: false,
      lastWatchedAt: new Date(Date.now() - 3600000),
    },
  });

  // John's Watchlist
  await prisma.watchlistItem.createMany({
    data: [
      { userId: johnUser.id, videoId: createdVideos[2].id },
      { userId: johnUser.id, videoId: createdVideos[4].id },
    ],
  });

  // John's Continue Watching
  await prisma.playbackProgress.create({
    data: {
      userId: johnUser.id,
      videoId: createdVideos[4].id,
      positionSeconds: 215,
      durationSeconds: 596,
      completed: false,
      lastWatchedAt: new Date(),
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--- DEMO ACCOUNTS ---');
  console.log('Admin:   admin@streamsphere.com / Admin123!');
  console.log('Premium: sarah@streamsphere.com / User123!');
  console.log('Basic:   john@streamsphere.com  / User123!');
  console.log('Free:    emma@streamsphere.com  / User123!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
