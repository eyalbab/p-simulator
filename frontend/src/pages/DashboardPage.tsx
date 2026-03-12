import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { getApiErrorMessage } from '@/lib/get-api-error-message'

type PhishingStatus = 'pending' | 'sent' | 'clicked'

type PhishingAttempt = {
  _id: string
  recipientEmail: string
  emailContent: string
  status: PhishingStatus
  sentAt?: string | null
  clickedAt?: string | null
  createdAt: string
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return '-'
  }

  return parsedDate.toLocaleString()
}

function getStatusVariant(status: PhishingStatus): 'outline' | 'secondary' | 'destructive' {
  if (status === 'clicked') {
    return 'destructive'
  }

  if (status === 'sent') {
    return 'secondary'
  }

  return 'outline'
}

function getStatusClassName(status: PhishingStatus): string {
  if (status === 'clicked') {
    return 'border-destructive/30 bg-destructive/10 text-destructive'
  }

  if (status === 'sent') {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800'
  }

  return 'border-amber-300 bg-amber-100 text-amber-800'
}

export function DashboardPage() {
  const { logout } = useAuth()
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [attempts, setAttempts] = useState<PhishingAttempt[]>([])
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true)
  const [attemptsError, setAttemptsError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAttempts = async (options?: { showSuccessToast?: boolean }) => {
    const shouldShowSuccessToast = options?.showSuccessToast ?? false
    setAttemptsError(null)
    setIsLoadingAttempts(true)

    try {
      const { data } = await apiClient.get<PhishingAttempt[]>('/phishing/attempts')
      setAttempts(data)

      if (shouldShowSuccessToast) {
        toast.success('Loaded phishing attempts successfully')
      }
    } catch (fetchError) {
      const message = getApiErrorMessage(fetchError)
      setAttemptsError(message)
      toast.error(message)
    } finally {
      setIsLoadingAttempts(false)
    }
  }

  useEffect(() => {
    void fetchAttempts()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await apiClient.post('/phishing/attempts', { recipientEmail, emailContent })
      toast.success('Phishing attempt sent successfully')
      setRecipientEmail('')
      setEmailContent('')
      await fetchAttempts()
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = attempts.filter((attempt) => attempt.status === 'pending').length
  const sentCount = attempts.filter((attempt) => attempt.status === 'sent').length
  const clickedCount = attempts.filter((attempt) => attempt.status === 'clicked').length

  return (
    <main className="min-h-screen bg-linear-to-b from-muted/50 via-background to-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Phishing Simulator Dashboard
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Send awareness tests and track recipient responses.
            </p>
          </div>
          <Button variant="outline" className="font-medium" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-semibold">{pendingCount}</p>
              </div>
              <Clock3 className="size-5 text-amber-600" aria-hidden="true" />
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Sent
                </p>
                <p className="mt-1 text-2xl font-semibold">{sentCount}</p>
              </div>
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Clicked
                </p>
                <p className="mt-1 text-2xl font-semibold">{clickedCount}</p>
              </div>
              <ShieldAlert className="size-5 text-destructive" aria-hidden="true" />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Send Phishing Test</CardTitle>
            <CardDescription>
              Compose a phishing simulation email and send it to a recipient.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="employee@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-content">Email Content</Label>
                <Textarea
                  id="email-content"
                  value={emailContent}
                  onChange={(event) => setEmailContent(event.target.value)}
                  placeholder="Write the email content here..."
                  className="min-h-32"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="font-medium">
                {isSubmitting ? 'Sending...' : 'Send Test'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Phishing Attempts</CardTitle>
                <CardDescription>
                  Review sent tests and track recipient engagement.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isLoadingAttempts}
                onClick={() => void fetchAttempts()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent aria-busy={isLoadingAttempts}>
            {isLoadingAttempts ? (
              <div className="space-y-2 py-2">
                <div className="h-9 animate-pulse rounded-md bg-muted" />
                <div className="h-9 animate-pulse rounded-md bg-muted" />
                <div className="h-9 animate-pulse rounded-md bg-muted" />
              </div>
            ) : null}

            {!isLoadingAttempts && attemptsError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 size-4 text-destructive" aria-hidden="true" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-destructive">
                      Could not load phishing attempts
                    </p>
                    <p className="text-sm text-muted-foreground">{attemptsError}</p>
                    <Button variant="outline" onClick={() => void fetchAttempts()}>
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {!isLoadingAttempts && !attemptsError && attempts.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm font-medium">No phishing attempts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send your first phishing test from the form above.
                </p>
              </div>
            ) : null}

            {!isLoadingAttempts && !attemptsError && attempts.length > 0 ? (
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Recipient Email</TableHead>
                    <TableHead>Email Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Clicked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell
                        className="max-w-56 truncate font-medium"
                        title={attempt.recipientEmail}
                      >
                        {attempt.recipientEmail}
                      </TableCell>
                      <TableCell className="max-w-80 truncate text-muted-foreground" title={attempt.emailContent}>
                        {attempt.emailContent}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(attempt.status)}
                          className={getStatusClassName(attempt.status)}
                        >
                          {attempt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(attempt.sentAt ?? attempt.createdAt)}</TableCell>
                      <TableCell>{formatDate(attempt.clickedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
