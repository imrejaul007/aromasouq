import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createTemplateDto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: createTemplateDto,
    });
  }

  async findAll(params?: { page?: number; limit?: number; isActive?: boolean }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where = params?.isActive !== undefined ? { isActive: params.isActive } : {};

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByKey(key: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key },
    });

    if (!template) {
      throw new NotFoundException(`Template with key ${key} not found`);
    }

    return template;
  }

  async findOne(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with id ${id} not found`);
    }

    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    try {
      return await this.prisma.notificationTemplate.update({
        where: { id },
        data: updateTemplateDto,
      });
    } catch (error) {
      throw new NotFoundException(`Template with id ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.notificationTemplate.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Template with id ${id} not found`);
    }
  }

  async renderTemplate(
    templateKey: string,
    variables: Record<string, any>,
  ): Promise<{
    emailSubject?: string;
    emailBody?: string;
    emailHtml?: string;
    smsBody?: string;
    pushTitle?: string;
    pushBody?: string;
    pushData?: any;
  }> {
    const template = await this.findByKey(templateKey);

    if (!template.isActive) {
      throw new NotFoundException(`Template ${templateKey} is not active`);
    }

    return {
      emailSubject: this.replaceVariables(template.emailSubject, variables),
      emailBody: this.replaceVariables(template.emailBody, variables),
      emailHtml: this.replaceVariables(template.emailHtml, variables),
      smsBody: this.replaceVariables(template.smsBody, variables),
      pushTitle: this.replaceVariables(template.pushTitle, variables),
      pushBody: this.replaceVariables(template.pushBody, variables),
      pushData: template.pushData,
    };
  }

  private replaceVariables(
    text: string | null,
    variables: Record<string, any>,
  ): string | null {
    if (!text) return null;

    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  async validateVariables(
    templateKey: string,
    variables: Record<string, any>,
  ): Promise<boolean> {
    const template = await this.findByKey(templateKey);
    const requiredVars = template.variables as string[];

    const missingVars = requiredVars.filter((v) => !(v in variables));

    if (missingVars.length > 0) {
      throw new Error(`Missing variables: ${missingVars.join(', ')}`);
    }

    return true;
  }
}
