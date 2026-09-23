import type { Resume, ResumeAnalysis } from '../app/types';
import { STORAGE_BUCKETS, supabase } from '../lib/supabaseClient';
import {
  assertNoError,
  buildStoragePath,
  extractStoragePathFromPublicUrl,
  getAuthenticatedAuthUser,
  runLoggedOperation,
  ServiceError,
} from './serviceUtils';

type ResumeRow = {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  domain_id: string | null;
  domain_name: string | null;
  uploaded_at: string;
};

type ResumeAnalysisRow = {
  id: string;
  user_id: string;
  resume_id: string;
  score: number;
  feedback: ResumeAnalysis;
  created_at: string;
};

class ResumeService {
  private mapResumeRow(row: ResumeRow, analysisRow?: ResumeAnalysisRow | null): Resume {
    return {
      id: row.id,
      userId: row.user_id,
      fileName: row.file_name || 'Resume',
      fileSize: row.file_size || 0,
      domainId: row.domain_id || '',
      domainName: row.domain_name || 'Unknown',
      content: '',
      uploadedAt: new Date(row.uploaded_at).getTime(),
      analysisResult: analysisRow?.feedback,
      fileUrl: row.file_url,
    };
  }

  private mergeResumeData(
    resumeRows: ResumeRow[] | null,
    analysisRows: ResumeAnalysisRow[] | null,
  ) {
    const analysisByResumeId = new Map(
      ((analysisRows || []) as ResumeAnalysisRow[]).map((analysisRow) => [
        analysisRow.resume_id,
        analysisRow,
      ]),
    );

    return ((resumeRows || []) as ResumeRow[]).map((resumeRow) =>
      this.mapResumeRow(resumeRow, analysisByResumeId.get(resumeRow.id) || null),
    );
  }

  async saveResume(resume: Resume) {
    return runLoggedOperation(
      'resumeService',
      'saveResume',
      {
        domainId: resume.domainId,
        domainName: resume.domainName,
        file: resume.file,
        id: resume.id,
      },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        if (!resume.file) {
          throw new ServiceError(
            'A resume file is required before the resume can be uploaded.',
          );
        }

        const storagePath = buildStoragePath(authUser.id, resume.file.name);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.resumes)
          .upload(storagePath, resume.file, {
            cacheControl: '3600',
            contentType: resume.file.type || 'application/octet-stream',
            upsert: false,
          });

        assertNoError(uploadError, 'Unable to upload the resume file.');

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKETS.resumes).getPublicUrl(storagePath);
        let resumeRecordCreated = false;

        try {
          const { data: resumeData, error: resumeError } = await supabase
            .from('resumes')
            .insert({
              domain_id: resume.domainId,
              domain_name: resume.domainName,
              file_name: resume.file.name,
              file_size: resume.file.size,
              file_url: publicUrl,
              id: resume.id,
              user_id: authUser.id,
            })
            .select('id, file_url, uploaded_at')
            .single<{
              id: string;
              file_url: string;
              uploaded_at: string;
            }>();

          assertNoError(resumeError, 'Unable to save the resume record.');
          resumeRecordCreated = true;
          console.log('[resumeService] saveResume:resumeStored', {
            fileUrl: resumeData.file_url,
            uploadedAt: resumeData.uploaded_at,
          });
          console.log('Resume ID:', resumeData.id);

          if (resume.analysisResult) {
            const { data: analysisData, error: analysisError } = await supabase
              .from('resume_analysis')
              .insert({
                feedback: resume.analysisResult,
                resume_id: resumeData.id,
                score: resume.analysisResult.overallScore,
                user_id: authUser.id,
              })
              .select('id, resume_id, score')
              .single<{ id: string; resume_id: string; score: number }>();

            assertNoError(analysisError, 'Unable to save the resume analysis.');
            console.log('[resumeService] saveResume:analysisStored', analysisData);
            console.log('Analysis saved');
          }

          return {
            ...resume,
            id: resumeData.id,
            fileName: resume.file.name,
            fileSize: resume.file.size,
            fileUrl: resumeData.file_url,
            uploadedAt: new Date(resumeData.uploaded_at).getTime(),
            userId: authUser.id,
          };
        } catch (error) {
          console.error('[resumeService] saveResume:cleanup:start', {
            error,
            storagePath,
            uploadPath: uploadData?.path || storagePath,
          });

          if (resumeRecordCreated) {
            const { error: resumeCleanupError } = await supabase
              .from('resumes')
              .delete()
              .eq('id', resume.id)
              .eq('user_id', authUser.id);

            if (resumeCleanupError) {
              console.error('[resumeService] saveResume:recordCleanup:error', resumeCleanupError);
            } else {
              console.log('[resumeService] saveResume:recordCleanup:success', {
                resumeId: resume.id,
              });
            }
          }

          const { error: cleanupError } = await supabase.storage
            .from(STORAGE_BUCKETS.resumes)
            .remove([storagePath]);

          if (cleanupError) {
            console.error('[resumeService] saveResume:cleanup:error', cleanupError);
          } else {
            console.log('[resumeService] saveResume:cleanup:success', { storagePath });
          }

          throw error;
        }
      },
    );
  }

  async getResumes() {
    return runLoggedOperation(
      'resumeService',
      'getResumes',
      undefined,
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const [
          { data: resumeData, error: resumeError },
          { data: analysisData, error: analysisError },
        ] = await Promise.all([
          supabase
            .from('resumes')
            .select('*')
            .eq('user_id', authUser.id)
            .order('uploaded_at', { ascending: false }),
          supabase
            .from('resume_analysis')
            .select('*')
            .eq('user_id', authUser.id),
        ]);

        assertNoError(resumeError, 'Unable to load resumes.');
        assertNoError(analysisError, 'Unable to load resume analysis.');

        return this.mergeResumeData(
          resumeData as ResumeRow[] | null,
          analysisData as ResumeAnalysisRow[] | null,
        );
      },
    );
  }

  async getResume(id: string) {
    return runLoggedOperation(
      'resumeService',
      'getResume',
      { id },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const [
          { data: resumeData, error: resumeError },
          { data: analysisData, error: analysisError },
        ] = await Promise.all([
          supabase
            .from('resumes')
            .select('*')
            .eq('id', id)
            .eq('user_id', authUser.id)
            .single<ResumeRow>(),
          supabase
            .from('resume_analysis')
            .select('*')
            .eq('resume_id', id)
            .eq('user_id', authUser.id)
            .maybeSingle<ResumeAnalysisRow>(),
        ]);

        assertNoError(resumeError, 'Unable to load the requested resume.');
        assertNoError(analysisError, 'Unable to load the requested resume analysis.');
        return this.mapResumeRow(resumeData, analysisData as ResumeAnalysisRow | null);
      },
    );
  }

  async deleteResume(id: string) {
    return runLoggedOperation(
      'resumeService',
      'deleteResume',
      { id },
      async () => {
        const authUser = await getAuthenticatedAuthUser();

        const { data, error } = await supabase
          .from('resumes')
          .select('file_url')
          .eq('id', id)
          .eq('user_id', authUser.id)
          .single<{ file_url: string }>();

        assertNoError(error, 'Unable to load the resume for deletion.');

        const storagePath = extractStoragePathFromPublicUrl(
          data.file_url,
          STORAGE_BUCKETS.resumes,
        );

        const { error: deleteRecordError } = await supabase
          .from('resumes')
          .delete()
          .eq('id', id)
          .eq('user_id', authUser.id);

        assertNoError(deleteRecordError, 'Unable to delete the resume record.');

        if (storagePath) {
          const { error: deleteFileError } = await supabase.storage
            .from(STORAGE_BUCKETS.resumes)
            .remove([storagePath]);

          assertNoError(deleteFileError, 'Unable to delete the uploaded resume file.');
        }

        return { success: true };
      },
    );
  }
}

export const resumeService = new ResumeService();
