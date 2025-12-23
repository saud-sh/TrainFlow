import { db } from "../server/db";
import { users, type UserRole } from "../shared/schema";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Seeding database...");

    const password = await bcrypt.hash("password123", 10);

    const roles: { role: UserRole; email: string; firstName: string; lastName: string }[] = [
        { role: 'administrator', email: 'admin@rocktech.sa', firstName: 'Admin', lastName: 'User' },
        { role: 'employee', email: 'employee@rocktech.sa', firstName: 'John', lastName: 'Employee' },
        { role: 'foreman', email: 'foreman@rocktech.sa', firstName: 'Site', lastName: 'Foreman' },
        { role: 'manager', email: 'manager@rocktech.sa', firstName: 'Project', lastName: 'Manager' },
        { role: 'training_officer', email: 'officer@rocktech.sa', firstName: 'Training', lastName: 'Officer' },
    ];

    for (const user of roles) {
        try {
            const [newUser] = await db.insert(users).values({
                email: user.email,
                password: password,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: true,
                tenantId: "default",
            }).onConflictDoNothing().returning();

            if (newUser) {
                console.log(`Created ${user.role}: ${user.email}`);
            } else {
                console.log(`User already exists: ${user.email}`);
            }
        } catch (error) {
            console.error(`Error creating ${user.role}:`, error);
        }
    }

    process.exit(0);
}

main();
