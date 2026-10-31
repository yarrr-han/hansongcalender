import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6In1rXDVS1Lvz7aHwsWQVouUXz1SIiUoWmQYLxtvhQQyw';
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_FILE = path.resolve(__dirname, 'data', 'events.json');
const NOTICES_FILE = path.resolve(__dirname, 'data', 'notices.json');

// Ensure data directory and files exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}
if (!fs.existsSync(NOTICES_FILE)) {
  fs.writeFileSync(NOTICES_FILE, '[]', 'utf-8');
}

// Teacher password configuration: Default to 'hansong1234!' or environment variable
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'hansong1234!';
const SALT = 'hansong-school-salt';
const HASHED_PASSWORD = crypto.pbkdf2Sync(TEACHER_PASSWORD, SALT, 1000, 64, 'sha512').toString('hex');

// In-memory active session tokens: token -> expiresAt (timestamp)
const activeSessions = new Map<string, number>();
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// Rate limiting for login attempts per IP: ip -> { count: number, lockUntil?: number }
const loginAttempts = new Map<string, { count: number; lockUntil?: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout after 5 failures

// Helper to read and write notices
function readNotices(): any[] {
  try {
    const raw = fs.readFileSync(NOTICES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading notices:', err);
    return [];
  }
}

function writeNotices(notices: any[]) {
  fs.writeFileSync(NOTICES_FILE, JSON.stringify(notices, null, 2), 'utf-8');
}

// Helper to read events
function readEvents(): any[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading events:', err);
    return [];
  }
}

// Helper to write events
function writeEvents(events: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

// Middleware: Verify Teacher Auth Token
function requireTeacherAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '교사 권한 인증이 필요합니다. 공용 비밀번호로 로그인해주세요.' });
    return;
  }

  const token = authHeader.substring(7);
  const expiresAt = activeSessions.get(token);

  if (!expiresAt || Date.now() > expiresAt) {
    if (expiresAt) activeSessions.delete(token);
    res.status(403).json({ error: '교사 세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.' });
    return;
  }

  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. [Public] Fetch all events
  app.get('/api/events', (_req: Request, res: Response) => {
    const events = readEvents();
    res.json(events);
  });

  // 2. [Public] Teacher login / password verification with rate-limiting
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Check rate limit
    const record = loginAttempts.get(ip) || { count: 0 };
    if (record.lockUntil && now < record.lockUntil) {
      const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
      res.status(429).json({
        error: `비밀번호 입력 시도 횟수를 초과했습니다. ${waitSeconds}초 후에 다시 시도해주세요.`,
        locked: true,
      });
      return;
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: '비밀번호를 입력해주세요.' });
      return;
    }

    // Verify hash
    const inputHash = crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(HASHED_PASSWORD, 'hex'));

    if (!isMatch) {
      record.count = (record.count || 0) + 1;
      const remaining = Math.max(0, MAX_ATTEMPTS - record.count);

      if (record.count >= MAX_ATTEMPTS) {
        record.lockUntil = now + LOCKOUT_MS;
        loginAttempts.set(ip, record);
        res.status(429).json({
          error: `비밀번호를 5회 연속 잘못 입력하여 1분간 로그인이 제한됩니다.`,
          remainingAttempts: 0,
          locked: true,
        });
        return;
      }

      loginAttempts.set(ip, record);
      res.status(401).json({
        error: `비밀번호가 올바르지 않습니다. (남은 시도: ${remaining}회)`,
        remainingAttempts: remaining,
      });
      return;
    }

    // Login success: reset rate limit & issue token
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + SESSION_DURATION_MS;
    activeSessions.set(token, expiresAt);

    res.json({
      success: true,
      token,
      expiresAt,
      message: '교사 권한 인증에 성공했습니다.',
    });
  });

  // 3. [Protected] Check session status
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.json({ authenticated: false });
      return;
    }

    const token = authHeader.substring(7);
    const expiresAt = activeSessions.get(token);

    if (!expiresAt || Date.now() > expiresAt) {
      if (expiresAt) activeSessions.delete(token);
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, expiresAt });
  });

  // 4. [Protected] Teacher logout / revoke session
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      activeSessions.delete(token);
    }
    res.json({ success: true, message: '편집 세션이 종료되었습니다.' });
  });

  // Helper validation for schedule input
  function validateScheduleInput(body: any): { error?: string } {
    const { title, date, grade, allDay, startTime, endTime, location } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return { error: '일정 제목을 입력해주세요.' };
    }
    if (title.trim().length > 100) {
      return { error: '제목은 최대 100자까지 입력 가능합니다.' };
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: '올바른 날짜(YYYY-MM-DD) 형식을 선택해주세요.' };
    }

    if (!['3', '4', 'common'].includes(grade)) {
      return { error: '대상 학년을 올바르게 선택해주세요 (3학년, 4학년, 3·4학년 공통).' };
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return { error: '장소를 입력해주세요 (공백 불가).' };
    }

    if (!allDay) {
      if (!startTime) {
        return { error: '종일 일정이 아닌 경우 시작 시간을 입력해주세요.' };
      }
      if (endTime && endTime < startTime) {
        return { error: '종료 시간은 시작 시간보다 빠를 수 없습니다.' };
      }
    }

    return {};
  }

  // 5. [Protected] Create event
  app.post('/api/events', requireTeacherAuth, (req: Request, res: Response) => {
    const validation = validateScheduleInput(req.body);
    if (validation.error) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { title, date, grade, allDay, startTime, endTime, location, description, createdBy } = req.body;
    const events = readEvents();

    const newEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date,
      grade,
      allDay: Boolean(allDay),
      startTime: allDay ? undefined : startTime || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      location: location.trim(),
      description: description ? description.trim() : '',
      createdBy: createdBy ? createdBy.trim() : '교사',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.push(newEvent);
    writeEvents(events);

    res.status(201).json(newEvent);
  });

  // 6. [Protected] Update event
  app.put('/api/events/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = validateScheduleInput(req.body);
    if (validation.error) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const events = readEvents();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      res.status(404).json({ error: '해당 일정을 찾을 수 없습니다.' });
      return;
    }

    const { title, date, grade, allDay, startTime, endTime, location, description, createdBy } = req.body;

    events[index] = {
      ...events[index],
      title: title.trim(),
      date,
      grade,
      allDay: Boolean(allDay),
      startTime: allDay ? undefined : startTime || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      location: location.trim(),
      description: description ? description.trim() : '',
      createdBy: createdBy ? createdBy.trim() : events[index].createdBy,
      updatedAt: new Date().toISOString(),
    };

    writeEvents(events);
    res.json(events[index]);
  });

  // 7. [Protected] Delete event
  app.delete('/api/events/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const events = readEvents();
    const index = events.findIndex((e) => e.id === id);

    if (index === -1) {
      res.status(404).json({ error: '해당 일정을 찾을 수 없습니다.' });
      return;
    }

    const deleted = events.splice(index, 1)[0];
    writeEvents(events);

    res.json({ success: true, message: '일정이 성공적으로 삭제되었습니다.', deletedId: deleted.id });
  });

  // --- Notice Board Endpoints ---
  // [Public] Get notices (optional ?date=YYYY-MM-DD)
  app.get('/api/notices', (req: Request, res: Response) => {
    const { date } = req.query;
    const notices = readNotices();
    if (date && typeof date === 'string') {
      const filtered = notices.filter((n) => n.date === date);
      res.json(filtered);
      return;
    }
    res.json(notices);
  });

  // [Protected] Create or update notice
  app.post('/api/notices', requireTeacherAuth, (req: Request, res: Response) => {
    const { id, date, grade, title, items, supplies, author } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: '알림장 날짜(YYYY-MM-DD)를 입력해주세요.' });
      return;
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: '알림장 제목을 입력해주세요.' });
      return;
    }
    if (!['3', '4', 'common'].includes(grade)) {
      res.status(400).json({ error: '대상 학년을 올바르게 선택해주세요.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: '알림장 내용을 최소 1개 이상 입력해주세요.' });
      return;
    }

    const notices = readNotices();
    const noticeId = id || `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingIndex = notices.findIndex((n) => n.id === noticeId);

    const noticeData = {
      id: noticeId,
      date,
      grade,
      title: title.trim(),
      items: items.map((i: any) => String(i).trim()).filter(Boolean),
      supplies: supplies ? supplies.trim() : undefined,
      author: author ? author.trim() : '교사',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      notices[existingIndex] = noticeData;
    } else {
      notices.push(noticeData);
    }

    writeNotices(notices);
    res.status(existingIndex >= 0 ? 200 : 201).json(noticeData);
  });

  // [Protected] Delete notice
  app.delete('/api/notices/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const notices = readNotices();
    const index = notices.findIndex((n) => n.id === id);

    if (index === -1) {
      res.status(404).json({ error: '해당 알림장을 찾을 수 없습니다.' });
      return;
    }

    const deleted = notices.splice(index, 1)[0];
    writeNotices(notices);
    res.json({ success: true, message: '알림장이 삭제되었습니다.', deletedId: deleted.id });
  });

  // 8. Gracefully handle AI Studio platform and upload probe calls (/_/*)
  app.all('/_/*', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'AI Studio internal route OK' });
  });

  // 9. [Public] Gemini AI Q&A endpoint for calendar events
  app.post('/api/qna', async (req: Request, res: Response) => {
    try {
      const { question, history } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: '질문 내용을 입력해주세요.' });
        return;
      }

      const events = readEvents();
      const notices = readNotices();
      const today = new Date();
      const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

      // Format events list for LLM context
      const formattedEvents = events.map((e) => {
        const gradeText = e.grade === '3' ? '3학년' : e.grade === '4' ? '4학년' : '3·4학년 공통';
        const timeText = e.allDay ? '종일' : `${e.startTime || ''} ~ ${e.endTime || ''}`.trim();
        return `- 날짜: ${e.date} | 학년: [${gradeText}] | 일정명: ${e.title} | 시간: ${timeText} | 장소: ${e.location} | 설명: ${e.description || '없음'} | 담당: ${e.createdBy || '교무실'}`;
      }).join('\n');

      // Format notices for LLM context
      const formattedNotices = notices.map((n) => {
        const gradeText = n.grade === '3' ? '3학년' : n.grade === '4' ? '4학년' : '공통';
        return `[${n.date} ${gradeText} 알림장: ${n.title}]
- 안내사항: ${n.items.join(' / ')}
- 준비물/참고: ${n.supplies || '없음'}
- 작성: ${n.author || '담임교사'}`;
      }).join('\n\n');

      const systemInstruction = `당신은 '한송초등학교 3, 4학년 일정 공유 캘린더'의 친절하고 상냥한 AI 도우미 '한송이'입니다.
학생, 학부모, 교사의 학사 일정 및 오늘 알림장(준비물, 과제, 하교 시간 등) 관련 질문에 대해 등록된 캘린더 데이터와 알림장 데이터를 바탕으로 정확하고 상냥하게 답변해주세요.

[현재 기준 날짜]
${todayStr} (한국 표준시)

[현재 등록된 한송초 3,4학년 학사 일정 데이터]
${formattedEvents || '현재 등록된 일정이 없습니다.'}

[등록된 오늘 알림장 데이터]
${formattedNotices || '현재 등록된 알림장이 없습니다.'}

[답변 원칙]
1. 등록된 일정 정보 및 알림장 정보를 바탕으로 질문(일자, 학년, 준비물, 숙제, 하교시간, 장소 등)에 대해 핵심을 일목요연하게 안내하세요.
2. 3학년, 4학년, 공통 알림장을 묻는 경우 학년별로 명확히 구분해서 알려주세요.
3. 달력이나 알림장에 없는 행사에 대한 질문을 받으면 솔직하고 친절하게 "해당 내용은 아직 알림장/달력에 등록되어 있지 않습니다. 담임선생님께 확인해 주세요."라고 안내하세요.
4. 초등학생이나 학부모가 읽기 편하도록 따뜻한 어조(존댓말)와 깔끔한 줄바꿈, 글머리 기호(•, -), 볼드체(**)를 사용하세요.`;

      // Build conversation history
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user' && item.text) {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'bot' && item.text) {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }
      contents.push({ role: 'user', parts: [{ text: question.trim() }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text || '죄송합니다. 답변을 생성하지 못했습니다.';
      res.json({ answer });
    } catch (err: any) {
      console.error('Gemini Q&A Error:', err);
      res.status(500).json({
        error: 'AI 도우미 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: err?.message,
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback in development mode using Vite's index.html transformer
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/_')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
