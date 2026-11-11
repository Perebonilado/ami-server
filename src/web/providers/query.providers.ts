import type { Provider } from '@nestjs/common';
import { AdminOverviewQuery } from '../../query/admin-overview.query.js';
import { BanksQuery } from '../../query/banks.query.js';
import { DownloadLinkQuery } from '../../query/download-link.query.js';
import { LibraryQuery } from '../../query/library.query.js';
import { LicenceCheckQuery } from '../../query/licence-check.query.js';
import { LicenceQuery } from '../../query/licence.query.js';
import { MeQuery } from '../../query/me.query.js';
import { PaymentSessionQuery } from '../../query/payment-session.query.js';
import { PayoutsQuery } from '../../query/payouts.query.js';
import { SearchVideosQuery } from '../../query/search-videos.query.js';
import { VideoQuery } from '../../query/video.query.js';

export const queryProviders: Provider[] = [
  MeQuery,
  SearchVideosQuery,
  VideoQuery,
  LicenceQuery,
  DownloadLinkQuery,
  LicenceCheckQuery,
  PaymentSessionQuery,
  LibraryQuery,
  AdminOverviewQuery,
  PayoutsQuery,
  BanksQuery,
];
