# Changelog - Narrative & Sentiment Analysis System

All notable changes to the Narrative & Sentiment Analysis System.

## [1.0.0] - 2025-10-21

### 🎉 Initial Release

Complete implementation of Token Narrative and Sentiment Analysis system using LunarCrush API v4.

### ✨ Added

#### Models
- **TokenNarrative.js** - Main narrative schema with unique tokenAddress constraint
  - Sentiment score and breakdown (positive/neutral/negative)
  - Social metrics (interactions, posts, contributors, engagement)
  - Trending indicators (up/down/flat with percent change)
  - Top creators/influencers with platform and influence score
  - Top posts with engagement metrics
  - Top news with engagement metrics
  - Time series data (7 days history)
  - AI Report in markdown format
  - Analysis status tracking (pending/processing/completed/failed)
  - Call reference metadata (messageId, channelId, timestamp)

- **SentimentAnalysis.js** - Detailed sentiment analysis history
  - Platform sentiment breakdown (Twitter, Reddit, YouTube, Telegram)
  - Overall sentiment with classification (very_negative to very_positive)
  - Engagement metrics (total, likes, shares, comments, views)
  - Extracted keywords (top 20 with frequency)
  - Extracted hashtags (top 15 with count)
  - Comparison with previous analysis (sentiment/engagement/volume deltas)
  - Analysis metadata (processing time, confidence, data source)
  - Trigger source tracking (discord_call/scheduled_update/manual_request)

#### Services
- **lunarCrushService.js** - Complete LunarCrush API v4 integration
  - Automatic rate limiting (10 req/min, 2000 req/day)
  - Topic data fetching
  - Time series data (7 days)
  - Top posts retrieval
  - News aggregation
  - Top creators/influencers
  - AI Report generation
  - Trending topics list
  - Complete token analysis (5 endpoints in parallel)
  - Weighted sentiment score calculation
  - Trending status extraction

- **narrativeService.js** - Business logic layer
  - `processTokenCall()` - Create or update narrative on new token call
  - `performTokenAnalysis()` - Complete asynchronous analysis workflow
  - `getTokenNarrative()` - Retrieve narrative with recent analyses
  - `searchNarratives()` - Search with filters and pagination
  - `reanalyzeToken()` - Force re-analysis
  - Platform sentiment extraction
  - Keyword extraction (stop words filtering)
  - Hashtag extraction
  - Smart update logic (increments totalCallsDetected)

#### Controllers
- **narrativeController.js** - 8 API endpoints
  - `createTokenNarrative` - POST / - Create/update narrative
  - `getNarrative` - GET /:tokenAddress - Get specific narrative
  - `searchNarrativesController` - GET /search - Search with filters
  - `getNarrativeStats` - GET /stats - General statistics
  - `getTrendingTokens` - GET /trending - Trending tokens
  - `reanalyze` - POST /:tokenAddress/reanalyze - Force re-analysis
  - `getTokenSentimentAnalyses` - GET /:tokenAddress/sentiment - Sentiment history
  - `deleteNarrative` - DELETE /:tokenAddress - Delete narrative (admin)

#### Routes
- **narrativeRoutes.js** - Complete Express router
  - All 8 endpoints with Swagger documentation
  - JWT authentication on all routes
  - Input validation
  - Error handling

#### Documentation
- **NARRATIVE_SENTIMENT_SYSTEM.md** - Complete documentation (2500+ lines)
  - Detailed data structure
  - System workflow
  - API endpoints with examples
  - Sentiment calculation explanation
  - Use cases
  - Troubleshooting guide

- **NARRATIVE_QUICKSTART.md** - Quick start guide
  - 5-minute setup
  - Practical examples
  - Common errors
  - Frontend integration examples

- **IMPLEMENTATION_SUMMARY.md** - Implementation summary
  - Complete checklist
  - Created/modified files
  - Project status
  - Next steps suggestions

- **NARRATIVE_README.md** - Main README
  - Overview
  - File structure
  - Quick start
  - Testing guide
  - Use cases

- **DEPLOYMENT_GUIDE.md** - Deployment guide
  - Pre-deployment checklist
  - Configuration steps
  - Health checks
  - Monitoring
  - Troubleshooting
  - Performance optimization

#### Examples
- **narrative-test.js** - Complete test suite
  - 8 example tests covering all endpoints
  - Execution instructions
  - Expected outputs

#### Integration
- Modified **messageService.js**
  - Auto-trigger when token detected in Discord messages
  - Extracts tokenSymbol and tokenAddress
  - Calls `processTokenCall()` asynchronously
  - Non-blocking (doesn't affect main flow)

- Modified **index.js**
  - Registered `/api/narrative` routes
  - Added narrativeRoutes import

- Modified **.env**
  - Added `LUNARCRUSH_API_KEY` configuration

### 🔧 Configuration

#### Environment Variables
```bash
LUNARCRUSH_API_KEY=9rne3zn2iqa6bm273w6bxp9dz5mgsfwwv63mgiaj8
```

#### MongoDB Indexes (Automatic)
- tokennarratives: tokenSymbol, tokenAddress, topicRank, sentimentScore, interactions
- sentimentanalyses: tokenAddress, narrativeId, sentiment score, engagement

### 📊 Features

- ✅ **Auto-trigger** - Automatic detection from Discord messages
- ✅ **Smart Update** - Updates instead of duplicating on same token
- ✅ **Complete Analysis** - 5 LunarCrush endpoints in parallel
- ✅ **AI Reports** - AI-generated markdown analysis
- ✅ **Sentiment Score** - Multi-factor weighted calculation (0-100)
- ✅ **Platform Breakdown** - Separate scores for each social platform
- ✅ **Time Series** - 7-day historical data
- ✅ **Top Content** - Creators, posts, news with engagement
- ✅ **Trending Detection** - Identifies tokens gaining/losing traction
- ✅ **Historical Tracking** - Preserves all analyses
- ✅ **Rate Limiting** - Automatic management (10/min, 2000/day)
- ✅ **Error Handling** - Partial analysis if some endpoints fail
- ✅ **Swagger Docs** - Automatic API documentation
- ✅ **Authentication** - JWT on all endpoints
- ✅ **Pagination** - All list endpoints support pagination
- ✅ **Filtering** - Search by sentiment, rank, status, symbol

### 🔐 Security

- JWT authentication on all endpoints
- API key stored in environment variables
- Rate limiting implemented
- Input validation on all endpoints

### 📈 Performance

- Asynchronous analysis (non-blocking)
- MongoDB indexes for optimized queries
- Parallel fetching of LunarCrush data
- Processing time: ~3-10 seconds per analysis
- Automatic rate limit management

### 🧪 Testing

- Complete test suite with 8 examples
- Coverage of all endpoints
- Instructions for execution
- Expected output samples

### 📚 Documentation

- 5 comprehensive documentation files
- Quick start guide
- Complete API reference
- Deployment guide
- Implementation summary

### 🔄 Workflow

```
Discord → Extract Token → Process Call → Create/Update Narrative
                              ↓
                    Async Analysis Started
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
   Fetch LunarCrush                         Calculate Sentiment
   (5 endpoints)                                   ↓
         ↓                                 Extract Data
   Generate AI Report                      (keywords, hashtags)
         ↓                                         ↓
         └────────────────────┬────────────────────┘
                              ↓
                    Update TokenNarrative
                              ↓
                  Create SentimentAnalysis
                              ↓
                            Done ✅
```

### 🎯 Use Cases

1. **Sentiment Dashboard** - Show top/worst tokens by sentiment
2. **Trending Alerts** - Notify when token is gaining traction
3. **Temporal Analysis** - Track sentiment evolution over time
4. **AI Reports** - Display complete AI-generated analysis
5. **Influencer Tracking** - Identify most active creators
6. **News Aggregation** - Aggregate relevant news per token

### 🐛 Known Issues

None at release.

### 🔮 Future Enhancements

- [ ] Cron job for periodic narrative updates
- [ ] Webhook/SSE for real-time notifications
- [ ] Frontend dashboard
- [ ] Data caching layer (Redis)
- [ ] Performance metrics (Prometheus/Grafana)
- [ ] Alert system for critical sentiment changes
- [ ] Batch processing support
- [ ] Category-based aggregate reports

### 📦 Dependencies

No new dependencies required. Uses existing:
- express
- mongoose
- axios
- dotenv

### 🚀 Deployment

Ready for production deployment. See `docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

### 👥 Contributors

- Implementation: Complete system developed
- Documentation: Comprehensive documentation suite
- Testing: Complete test suite with examples

### 📝 Notes

- LunarCrush Individual Plan rate limits: 10 req/min, 2000 req/day
- Analysis is asynchronous (3-10 seconds processing time)
- Symbols must exist on LunarCrush platform
- AI Reports may timeout (15s timeout configured)
- MongoDB collections created automatically on first use

---

## [Unreleased]

### Planned Features
- Scheduled narrative updates (cron job)
- Real-time notifications (WebSocket/SSE)
- Dashboard frontend
- Redis caching layer
- Enhanced error recovery
- Batch processing
- Multi-language AI reports

---

**Format:** Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
**Versioning:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
