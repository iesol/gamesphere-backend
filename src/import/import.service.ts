import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { User } from '../users/user.entity';
import { OrganizationUser } from '../users/organization-user.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(OrganizationUser)
    private orgUserRepo: Repository<OrganizationUser>,
  ) {}

  async importUsers(
    orgId: string,
    fileBuffer: Buffer,
    mimeType: string,
    duplicateMode: 'skip' | 'update' = 'skip',
  ) {
    if (fileBuffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('File too large. Max 5MB.');
    }

    let records: any[];
    if (mimeType === 'text/csv') {
      const content = fileBuffer.toString('utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      if (lines.length > 10001) {
        throw new BadRequestException('Too many rows. Max 10,000.');
      }
      records = parse(content, { columns: true, skip_empty_lines: true });
    } else if (mimeType === 'application/json') {
      const content = JSON.parse(fileBuffer.toString('utf-8'));
      records = Array.isArray(content) ? content : [content];
      if (records.length > 10000) {
        throw new BadRequestException('Too many rows. Max 10,000.');
      }
    } else {
      throw new BadRequestException('Invalid file type. Use CSV or JSON.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors: { row: number; reason: string }[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.email || !emailRegex.test(row.email)) {
        errors.push({ row: rowNum, reason: 'Invalid email' });
        continue;
      }
      if (!row.name) {
        errors.push({ row: rowNum, reason: 'Name is required' });
        continue;
      }

      const existingUser = await this.userRepo.findOne({ where: { email: row.email } });
      if (existingUser) {
        if (duplicateMode === 'skip') {
          skipped++;
          continue;
        }
        if (duplicateMode === 'update') {
          existingUser.name = row.name;
          existingUser.gameProfiles = this.parseGameProfiles(row);
          await this.userRepo.save(existingUser);
          imported++;
          continue;
        }
      }

      const user = this.userRepo.create({
        email: row.email,
        name: row.name,
        gameProfiles: this.parseGameProfiles(row),
      });
      await this.userRepo.save(user);
      await this.orgUserRepo.save(
        this.orgUserRepo.create({ userId: user.id, orgId, roles: ['player'] }),
      );
      imported++;
    }

    return { imported, skipped, errors };
  }

  private parseGameProfiles(row: any): Record<string, any> {
    const profiles: Record<string, any> = {};
    for (let g = 1; g <= 5; g++) {
      const game = row[`game${g}`];
      if (!game) break;
      profiles[game] = {
        position: row[`position${g}`] || null,
        level: row[`level${g}`] || null,
      };
    }
    return profiles;
  }
}
