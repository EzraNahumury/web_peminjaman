import { z } from 'zod';

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
    email: z.string().trim().toLowerCase().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
    organizationName: z.string().trim().min(2, 'Nama organisasi wajib diisi'),
    phone: z.string().trim().min(6, 'Nomor HP minimal 6 karakter'),
    identityNumber: z.string().trim().optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const dtIso = z
  .string()
  .min(1, 'Wajib diisi')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Tanggal/jam tidak valid');

export const FacilityRequestSchema = z
  .object({
    facilityId: z.coerce.number().int().positive('Pilih fasilitas'),
    activityName: z.string().trim().min(3, 'Nama kegiatan minimal 3 karakter'),
    organizationName: z.string().trim().min(2, 'Nama organisasi wajib diisi'),
    personInCharge: z.string().trim().min(2, 'Penanggung jawab wajib diisi'),
    identityNumber: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().toLowerCase().email('Email tidak valid'),
    phone: z.string().trim().min(6, 'No HP wajib diisi'),
    startDateTime: dtIso,
    endDateTime: dtIso,
    participantCount: z.coerce.number().int().min(0).optional(),
    purpose: z.string().trim().min(3, 'Tujuan wajib diisi'),
    description: z.string().trim().min(3, 'Deskripsi wajib diisi'),
    activityScope: z.enum(['UNIVERSITAS', 'FAKULTAS']).default('UNIVERSITAS'),
    activityLevel: z.enum(['AKADEMIK', 'INSTITUSIONAL', 'KEMAHASISWAAN']).default('KEMAHASISWAAN'),
    additionalNeeds: z.string().trim().optional().or(z.literal('')),
    attachmentUrl: z.string().trim().optional().or(z.literal('')),
    notes: z.string().trim().optional().or(z.literal('')),
  })
  .refine((d) => new Date(d.endDateTime) > new Date(d.startDateTime), {
    message: 'Tanggal/jam selesai harus setelah mulai',
    path: ['endDateTime'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type FacilityRequestInput = z.infer<typeof FacilityRequestSchema>;
