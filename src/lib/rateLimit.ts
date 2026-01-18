import crypto from "crypto";                                                                                                                      
                                                                                                                                                    
  interface RateLimitRecord {                                                                                                                       
    count: number;                                                                                                                                  
    resetTime: number;                                                                                                                              
  }                                                                                                                                                 
                                                                                                                                                    
  const rateLimitMap = new Map<string, RateLimitRecord>();                                                                                          
                                                                                                                                                    
  /**                                                                                                                                               
   * Hash identifiers so we never store raw IPs.                                                                                                    
   */                                                                                                                                               
  function hash(input: string) {                                                                                                                    
    return crypto.createHash("sha256").update(input).digest("hex");                                                                                 
  }                                                                                                                                                 
                                                                                                                                                    
  /**                                                                                                                                               
   * Derive a stable client identifier.                                                                                                             
   */                                                                                                                                               
  function getClientId(req: Request): string {                                                                                                      
    const forwarded =                                                                                                                               
      req.headers.get("x-vercel-forwarded-for") ||                                                                                                  
      req.headers.get("x-forwarded-for") ||                                                                                                         
      req.headers.get("x-real-ip") ||                                                                                                               
      "unknown";                                                                                                                                    
                                                                                                                                                    
    const ip = forwarded.split(",")[0].trim();                                                                                                      
    return hash(ip);                                                                                                                                
  }                                                                                                                                                 
                                                                                                                                                    
  /**                                                                                                                                               
   * Simple in-memory rate limiter (resets on serverless cold start).                                                                               
   */                                                                                                                                               
  export async function rateLimitOrThrow(opts: {                                                                                                    
    req: Request;                                                                                                                                   
    keyPrefix: string;                                                                                                                              
    limit: number;                                                                                                                                  
    windowSeconds: number;                                                                                                                          
  }) {                                                                                                                                              
    const { req, limit, windowSeconds } = opts;                                                                                                     
    const clientId = getClientId(req);                                                                                                              
    const now = Date.now();                                                                                                                         
    const windowMs = windowSeconds * 1000;                                                                                                          
                                                                                                                                                    
    const record = rateLimitMap.get(clientId);                                                                                                      
                                                                                                                                                    
    // No record or expired - create new                                                                                                            
    if (!record || now > record.resetTime) {                                                                                                        
      const resetTime = now + windowMs;                                                                                                             
      rateLimitMap.set(clientId, { count: 1, resetTime });                                                                                          
      return; // Allowed                                                                                                                            
    }                                                                                                                                               
                                                                                                                                                    
    // Check limit                                                                                                                                  
    if (record.count >= limit) {                                                                                                                    
      const err = new Error("RATE_LIMITED");                                                                                                        
      (err as any).status = 429;                                                                                                                    
      throw err;                                                                                                                                    
    }                                                                                                                                               
                                                                                                                                                    
    // Increment count                                                                                                                              
    record.count++;                                                                                                                                 
  }                                                                                                                                                 
                                                                                                                                                    
  // Cleanup old entries every hour                                                                                                                 
  setInterval(() => {                                                                                                                               
    const now = Date.now();                                                                                                                         
    for (const [key, record] of rateLimitMap.entries()) {                                                                                           
      if (now > record.resetTime) {                                                                                                                 
        rateLimitMap.delete(key);                                                                                                                   
      }                                                                                                                                             
    }                                                                                                                                               
  }, 3600000);   
