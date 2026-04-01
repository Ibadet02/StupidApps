import sqlite3

conn = sqlite3.connect("prisma/dev.db")
conn.executescript(open("prisma/seed.sql").read())
conn.close()
print("Seeded successfully!")
