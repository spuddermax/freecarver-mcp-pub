import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL, // e.g., postgres://username:password@localhost/freecarver_store
});

async function createSuperAdmin() {
	try {
		const email = process.env.SUPER_ADMIN_EMAIL;
		const password = process.env.SUPER_ADMIN_PASSWORD;
		const firstName = process.env.SUPER_ADMIN_FIRST_NAME;
		const lastName = process.env.SUPER_ADMIN_LAST_NAME;
		const avatarUrl = process.env.SUPER_ADMIN_AVATAR_URL;

		// Check if the admin already exists
		const existing = await pool.query(
			"SELECT * FROM admin_users WHERE email = $1",
			[email]
		);
		if (existing.rows.length > 0) {
			console.log("Super admin already exists.");
			process.exit(0);
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Check if the "super_admin" role exists, and if not, create it
		let roleResult = await pool.query(
			"SELECT id FROM admin_roles WHERE role_name = $1",
			["super_admin"]
		);
		let roleId;
		if (roleResult.rows.length === 0) {
			const insertRole = await pool.query(
				"INSERT INTO admin_roles(role_name, created_at, updated_at) VALUES($1, NOW(), NOW()) RETURNING id",
				["super_admin", "admin"]
			);
			roleId = insertRole.rows[0].id;
			console.log(`Created new role "super_admin" with id ${roleId}`);
		} else {
			roleId = roleResult.rows[0].id;
		}

		// Insert the new super admin into the admin_users table
		const insertQuery = `
      INSERT INTO admin_users(email, password_hash, role_id, first_name, last_name, avatar_url, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *
    `;
		const newAdmin = await pool.query(insertQuery, [
			email,
			hashedPassword,
			roleId,
			firstName,
			lastName,
			avatarUrl,
		]);

		console.log("Super admin created:", newAdmin.rows[0]);
		process.exit(0);
	} catch (err) {
		console.error("Error creating super admin:", err);
		process.exit(1);
	}
}

createSuperAdmin();
