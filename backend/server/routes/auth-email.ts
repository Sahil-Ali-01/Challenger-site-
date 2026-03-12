import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { supabase } from "../lib/db";
import { generateToken, verifyToken } from "../utils/generateToken";
import {
  sendEmail,
} from "../services/emailService";
import {
  deliverAdminNewUserEmail,
  deliverPasswordResetEmail,
  deliverVerificationEmail,
  deliverWelcomeEmail,
} from "../services/emailQueueService";
import { randomUUID } from "crypto";

const router = Router();

const USERNAME_MAX_LENGTH = 24;
let usernameColumnAvailable: boolean | null = null;
let userStatsEmailColumnAvailable: boolean | null = null;

function sendAdminRegistrationEmailInBackground(name: string, email: string, userId: string) {
  void deliverAdminNewUserEmail({
    email,
    userName: name,
    userId,
  })
    .then((sent) => {
      if (sent) {
        console.log(`✅ Admin notification email dispatched for new user ${email}`);
      } else {
        console.warn(`⚠️ Admin notification email skipped/failed for new user ${email}`);
      }
    })
    .catch((error) => {
      console.error(`❌ Admin notification email background error for ${email}:`, error);
    });
}

async function hasUsernameColumn() {
  if (usernameColumnAvailable !== null) {
    return usernameColumnAvailable;
  }

  const { error } = await supabase.from("profiles").select("username").limit(1);
  if (error && String(error.message || "").includes("does not exist")) {
    usernameColumnAvailable = false;
  } else {
    usernameColumnAvailable = true;
  }

  return usernameColumnAvailable;
}

async function hasUserStatsEmailColumn() {
  if (userStatsEmailColumnAvailable !== null) {
    return userStatsEmailColumnAvailable;
  }

  const { error } = await supabase.from("user_stats").select("email").limit(1);
  if (error && String(error.message || "").includes("does not exist")) {
    userStatsEmailColumnAvailable = false;
  } else {
    userStatsEmailColumnAvailable = true;
  }

  return userStatsEmailColumnAvailable;
}

function slugifyUsername(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

async function usernameExists(username: string) {
  if (!(await hasUsernameColumn())) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (error) {
    console.warn("⚠️ username lookup failed, treating as available:", error.message);
    return false;
  }

  return (data?.length || 0) > 0;
}

async function generateUniqueUsername(name: string, email: string) {
  const emailBase = (email || "").split("@")[0] || "";
  const baseSeed = slugifyUsername(name) || slugifyUsername(emailBase) || "player";
  const base = baseSeed.slice(0, USERNAME_MAX_LENGTH);

  // Try base first.
  if (!(await usernameExists(base))) {
    return base;
  }

  // Then try randomized suffixes.
  for (let i = 0; i < 50; i++) {
    const suffix = String(1000 + Math.floor(Math.random() * 9000));
    const prefix = base.slice(0, Math.max(1, USERNAME_MAX_LENGTH - suffix.length));
    const candidate = `${prefix}${suffix}`;

    if (!(await usernameExists(candidate))) {
      return candidate;
    }
  }

  // Final deterministic fallback.
  const fallbackSuffix = randomUUID().replace(/-/g, "").slice(0, 8);
  const prefix = base.slice(0, Math.max(1, USERNAME_MAX_LENGTH - fallbackSuffix.length));
  return `${prefix}${fallbackSuffix}`;
}

/**
 * POST /api/auth/register
 * Register a new user with email verification
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Database not configured",
      });
    }

    const { name, email, password } = req.body;
    console.log("📝 Registration request:", { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    // Check if email already exists
    const selectColumns = (await hasUsernameColumn())
      ? "id, email_verified, name, username"
      : "id, email_verified, name";

    const { data: existingUserRaw, error: checkError } = await supabase
      .from("profiles")
      .select(selectColumns as any)
      .eq("email", email)
      .single();

    const existingUser = existingUserRaw as any;

    if (existingUser) {
      // If email exists but NOT verified, resend verification email
      if (!existingUser.email_verified) {
        console.log("📧 Unverified account found, resending verification email...");

        // Update password in case user changed it
        const passwordHash = await bcrypt.hash(password, 10);
        const updatePayload: any = { password_hash: passwordHash, name };
        const existingUsername = (existingUser as any)?.username;
        if (await hasUsernameColumn()) {
          updatePayload.username = existingUsername || (await generateUniqueUsername(name, email));
        }

        await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", existingUser.id);

        let emailSent = false;
        try {
          const verificationToken = generateToken(email, existingUser.id, "email_verification", "24h");
          emailSent = await deliverVerificationEmail({
            email,
            userName: name,
            verificationToken,
          });
        } catch (tokenError) {
          console.error("❌ Failed to resend verification email for existing user:", tokenError);
        }

        return res.status(200).json({
          message: emailSent
            ? "A verification email has been resent. Please check your inbox (and spam folder)."
            : "Account exists but verification email could not be sent right now. Please try again shortly.",
          emailSent,
        });
      }

      return res.status(400).json({
        error: "Email already registered and verified. Please login instead.",
      });
    }

    // Generate user ID and hash password
    const userId = randomUUID();
    const shouldPersistUsername = await hasUsernameColumn();
    const username = shouldPersistUsername
      ? await generateUniqueUsername(name, email)
      : slugifyUsername(name) || email.split("@")[0] || "player";
    console.log("🔐 Hashing password and creating profile...");
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user profile with password hash
    const profileInsertPayload: any = {
      id: userId,
      name,
      email,
      password_hash: passwordHash,
      email_verified: false,
    };

    if (shouldPersistUsername) {
      profileInsertPayload.username = username;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([profileInsertPayload])
      .select()
      .single();

    if (profileError) {
      console.error("❌ Profile creation error:", profileError);
      return res.status(400).json({
        error: "Failed to create user profile",
      });
    }

    console.log("✅ Profile created successfully");

    // Create user_stats entry with initial stats
    console.log("📊 Creating user_stats entry...");
    const shouldPersistStatsEmail = await hasUserStatsEmailColumn();
    const userStatsInsertPayload: any = {
      id: userId,
      name,
      elo_rating: 1200,
      total_wins: 0,
      total_losses: 0,
      total_quizzes: 0,
      accuracy_percentage: 0,
      quizzes_completed: 0,
      avg_accuracy: 0,
    };

    if (shouldPersistStatsEmail) {
      userStatsInsertPayload.email = email;
    }

    const { error: statsError } = await supabase
      .from("user_stats")
      .insert([userStatsInsertPayload])
      .select()
      .single();

    if (statsError) {
      console.warn("⚠️  user_stats entry creation failed:", statsError);
      // Don't fail registration if leaderboard creation fails
    } else {
      console.log("✅ user_stats entry created successfully");
    }

    // Create leaderboard entry with actual DB schema columns
    const { error: leaderboardError } = await supabase
      .from("leaderboard")
      .insert([
        {
          user_id: userId,
          elo_rating: 1200,
          total_wins: 0,
          total_losses: 0,
          total_quizzes: 0,
          correct_answers: 0,
          accuracy_percentage: 0,
          total_points: 0,
          weekly_points: 0,
          daily_points: 0,
          streak: 0,
          updated_at: new Date().toISOString(),
        },
      ]);

    if (leaderboardError) {
      console.warn("⚠️  leaderboard entry creation failed:", leaderboardError);
    } else {
      console.log("✅ leaderboard entry created successfully");
    }

    // Generate verification token and queue email without blocking registration success.
    let emailSent = false;
    try {
      console.log("🔐 Generating verification token...");
      const verificationToken = generateToken(email, userId, "email_verification", "24h");
      console.log("✅ Token generated");
      console.log("📧 Dispatching verification email for", email);
      emailSent = await deliverVerificationEmail({
        email,
        userName: name,
        verificationToken,
      });
      console.log("📧 Queueing admin registration notification for", email);
      sendAdminRegistrationEmailInBackground(name, email, userId);
    } catch (tokenError) {
      console.error("❌ Failed to queue verification email:", tokenError);
    }

    res.status(201).json({
      message: emailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful, but verification email could not be sent right now. Please try again shortly.",
      user: {
        id: profile.id,
        name: profile.name,
        username: profile.username || username,
        email: profile.email,
        email_verified: profile.email_verified,
      },
      emailSent,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      error: "Internal server error during registration",
    });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify user email with token
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    console.log("📧 Verify email request received");

    if (!token) {
      return res.status(400).json({
        error: "Verification token is required",
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token as string);

    if (!decoded) {
      console.error("❌ Invalid or expired token");
      return res.status(400).json({
        error: "Invalid or expired verification token",
      });
    }

    console.log("✅ Token decoded successfully");

    // Update user email_verified status
    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", decoded.userId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Email verification update error:", updateError);
      return res.status(400).json({
        error: "Failed to verify email",
      });
    }

    console.log("✅ Email verified in database");

    // Ensure user_stats entry exists (backup for registration)
    const { data: statsCheck } = await supabase
      .from("user_stats")
      .select("id")
      .eq("id", decoded.userId)
      .single();

    if (!statsCheck) {
      console.log("📊 Creating user_stats entry (backup)...");
      const shouldPersistStatsEmail = await hasUserStatsEmailColumn();
      const userStatsInsertPayload: any = {
        id: decoded.userId,
        name: updateData.name,
        elo_rating: 1200,
        total_wins: 0,
        total_losses: 0,
        total_quizzes: 0,
        accuracy_percentage: 0,
        quizzes_completed: 0,
        avg_accuracy: 0,
      };

      if (shouldPersistStatsEmail) {
        userStatsInsertPayload.email = updateData.email;
      }

      const { error: statsCreateError } = await supabase
        .from("user_stats")
        .insert([userStatsInsertPayload]);

      if (statsCreateError) {
        console.warn("⚠️  user_stats entry creation failed:", statsCreateError);
      } else {
        console.log("✅ user_stats entry created (backup)");
      }
    }

    // Ensure leaderboard entry exists (backup)
    const { data: leaderboardCheck } = await supabase
      .from("leaderboard")
      .select("id")
      .eq("user_id", decoded.userId)
      .single();

    if (!leaderboardCheck) {
      const { error: leaderboardCreateError } = await supabase
        .from("leaderboard")
        .insert([
          {
            user_id: decoded.userId,
            elo_rating: 1200,
            total_wins: 0,
            total_losses: 0,
            total_quizzes: 0,
            correct_answers: 0,
            accuracy_percentage: 0,
            total_points: 0,
            weekly_points: 0,
            daily_points: 0,
            streak: 0,
            updated_at: new Date().toISOString(),
          },
        ]);

      if (leaderboardCreateError) {
        console.warn("⚠️  leaderboard entry creation failed:", leaderboardCreateError);
      } else {
        console.log("✅ leaderboard entry created (backup)");
      }
    }

    // Queue welcome email without blocking successful verification.
    console.log("📧 Dispatching welcome email...");
    void deliverWelcomeEmail({
      email: decoded.email,
      userName: updateData.name,
    });

    console.log("✅ Email verification complete");

    res.json({
      message: "Email verified successfully! Welcome to Quiz Challenge Arena.",
      user: {
        id: updateData.id,
        name: updateData.name,
        username: updateData.username,
        email: updateData.email,
        email_verified: updateData.email_verified,
      },
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({
      error: "Internal server error during email verification",
    });
  }
});

/**
 * POST /api/auth/resend-verification-email
 * Resend verification email if user hasn't verified yet
 */
router.post("/resend-verification-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        error: "Email already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateToken(email, user.id, "email_verification", "24h");

    // Queue verification email
    const emailSent = await deliverVerificationEmail({
      email,
      userName: user.name,
      verificationToken,
    });

    res.json({
      message: "Verification email resent successfully",
      emailSent,
    });
  } catch (error) {
    console.error("❌ Resend verification email error:", error);
    res.status(500).json({
      error: "Failed to resend verification email",
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate password reset token (expires in 1 hour)
    const resetToken = generateToken(email, user.id, "password_reset", "1h");

    // Queue password reset email
    const emailSent = await deliverPasswordResetEmail({
      email,
      userName: user.name,
      resetToken,
      expirationTime: "1 hour",
    });

    res.json({
      message: "If an account exists with this email, a password reset link has been sent.",
      emailSent,
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      error: "Failed to process password reset request",
    });
  }
});

/**
 * POST /api/auth/test-email
 * Send a quick test email using configured SMTP credentials.
 */
router.post("/test-email", async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: "Recipient email is required",
      });
    }

    const emailSent = await sendEmail({
      to,
      subject: "Test Email - Quiz Challenge Arena",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMTP Test Successful</h2>
          <p>This is a test email from Quiz Challenge Arena backend.</p>
          <p>If you received this, your SMTP configuration is working.</p>
        </div>
      `,
      text: "SMTP Test Successful. Your Quiz Challenge Arena backend email configuration is working.",
    });

    if (!emailSent) {
      return res.status(502).json({
        error: "Failed to send test email",
      });
    }

    res.json({
      message: "Test email sent successfully",
      emailSent,
    });
  } catch (error) {
    console.error("❌ Test email error:", error);
    res.status(500).json({
      error: "Internal server error while sending test email",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with valid token
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Database not configured",
      });
    }

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== "password_reset") {
      return res.status(400).json({
        error: "Invalid or expired password reset token",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the same password field used by the custom login flow.
    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({ password_hash: passwordHash })
      .eq("id", decoded.userId)
      .eq("email", decoded.email)
      .select("id")
      .single();

    if (updateError || !updatedUser) {
      console.error("❌ Password hash update failed:", updateError);
      return res.status(400).json({
        error: "Failed to update password",
      });
    }

    res.json({
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({
      error: "Failed to reset password",
    });
  }
});

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login request:", { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      console.log("⚠️ Email not verified:", email);
      return res.status(403).json({
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    // Compare passwords
    console.log("🔐 Comparing passwords...");
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate login token (expires in 7 days)
    const loginToken = generateToken(email, user.id, "login", "7d");

    console.log("✅ Login successful for:", email);

    res.json({
      message: "Login successful",
      token: loginToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || user.email?.split("@")[0],
        email: user.email,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile and stats (requires JWT token)
 */
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization header required",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("🔐 Verifying token for /me endpoint...");

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== "login") {
      console.log("❌ Invalid or expired token");
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    console.log("✅ Token verified for user:", decoded.email);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: "User profile not found",
      });
    }

    // Fetch stats from leaderboard (primary table for battle points/rating)
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("user_id", decoded.userId)
      .single();

    let effectiveLeaderboard = leaderboard;

    if (leaderboardError) {
      console.warn("⚠️ leaderboard row not found for user, using fallbacks");

      const { data: createdLeaderboard, error: createLeaderboardError } = await supabase
        .from("leaderboard")
        .insert({
          user_id: decoded.userId,
          elo_rating: 1200,
          total_wins: 0,
          total_losses: 0,
          total_quizzes: 0,
          correct_answers: 0,
          accuracy_percentage: 0,
          total_points: 0,
          weekly_points: 0,
          daily_points: 0,
          streak: 0,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!createLeaderboardError && createdLeaderboard) {
        effectiveLeaderboard = createdLeaderboard;
      }
    }

    // Fetch stats from user_stats as fallback
    const { data: userStats, error: userStatsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (userStatsError) {
      console.warn("⚠️ user_stats row not found for user, returning defaults");
    }

    const wins = effectiveLeaderboard?.total_wins ?? userStats?.total_wins ?? 0;
    const losses = effectiveLeaderboard?.total_losses ?? userStats?.total_losses ?? 0;
    const totalQuizzes = effectiveLeaderboard?.total_quizzes ?? userStats?.total_quizzes ?? wins + losses;
    const accuracyPercentage =
      effectiveLeaderboard?.accuracy_percentage ??
      userStats?.accuracy_percentage ??
      (totalQuizzes > 0 ? (wins / totalQuizzes) * 100 : 0);

    const fallbackUsername = profile.username || profile.email?.split("@")[0] || "player";
    const fallbackName = profile.name || fallbackUsername;

    const mergedLeaderboard = {
      user_id: profile.id,
      username: effectiveLeaderboard?.username || fallbackUsername,
      full_name: effectiveLeaderboard?.full_name || fallbackName,
      elo_rating: effectiveLeaderboard?.elo_rating ?? userStats?.elo_rating ?? 1200,
      total_wins: wins,
      total_losses: losses,
      total_quizzes: totalQuizzes,
      correct_answers: effectiveLeaderboard?.correct_answers ?? Math.round((totalQuizzes * accuracyPercentage) / 100),
      accuracy_percentage: accuracyPercentage,
      total_points: effectiveLeaderboard?.total_points ?? 0,
      weekly_points: effectiveLeaderboard?.weekly_points ?? 0,
      daily_points: effectiveLeaderboard?.daily_points ?? 0,
      streak: effectiveLeaderboard?.streak ?? 0,
      best_streak: effectiveLeaderboard?.best_streak ?? 0,
    };

    // Compute global rank from all-time points with ELO as tie-breaker.
    let globalRank: number | null = null;
    const pointsForRank = mergedLeaderboard.total_points ?? 0;
    const eloForRank = mergedLeaderboard.elo_rating ?? 1200;
    const userIdForRank = profile.id;

    const { count: higherPointsCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .gt("total_points", pointsForRank);

    const { count: samePointsHigherEloCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .eq("total_points", pointsForRank)
      .gt("elo_rating", eloForRank);

    // Final deterministic tie-breaker: for identical points+elo,
    // lower user_id ranks first so each user gets a unique position.
    const { count: samePointsSameEloHigherIdCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .eq("total_points", pointsForRank)
      .eq("elo_rating", eloForRank)
      .lt("user_id", userIdForRank);

    globalRank =
      (higherPointsCount || 0) +
      (samePointsHigherEloCount || 0) +
      (samePointsSameEloHigherIdCount || 0) +
      1;

    const rankedLeaderboard = {
      ...mergedLeaderboard,
      global_rank: globalRank,
    };

    // Keep user_stats updated with name/email from profile when available
    if (userStats) {
      const shouldPersistStatsEmail = await hasUserStatsEmailColumn();
      const userStatsUpdatePayload: any = { name: profile.name };
      if (shouldPersistStatsEmail) {
        userStatsUpdatePayload.email = profile.email;
      }

      await supabase
        .from("user_stats")
        .update(userStatsUpdatePayload)
        .eq("id", profile.id);
    }

    console.log("✅ User profile fetched successfully");

    res.json({
      message: "User profile retrieved successfully",
      user: {
        id: profile.id,
        name: profile.name,
        username: profile.username || fallbackUsername,
        email: profile.email,
        email_verified: profile.email_verified,
      },
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({
      error: "Internal server error fetching user profile",
    });
  }
});

export default router;
