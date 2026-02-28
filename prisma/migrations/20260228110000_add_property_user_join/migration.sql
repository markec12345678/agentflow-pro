-- CreateTable (implicit many-to-many join: Property <-> User)
CREATE TABLE "_PropertyToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PropertyToUser_AB_unique" ON "_PropertyToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PropertyToUser_B_index" ON "_PropertyToUser"("B");

-- AddForeignKey
ALTER TABLE "_PropertyToUser" ADD CONSTRAINT "_PropertyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyToUser" ADD CONSTRAINT "_PropertyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
