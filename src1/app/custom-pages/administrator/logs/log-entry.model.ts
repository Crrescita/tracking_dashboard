export interface LogEntry {
  level: string;
  message: string;
  meta: {
    req: {
      headers: {
        [key: string]: string;
      };
    };
    res: {
      statusCode: number;
    };
    responseTime: number;
  };
  timestamp: string;
}
