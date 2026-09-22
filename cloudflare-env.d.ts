declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CMC_PRO_API_KEY?: string;
  }
}
