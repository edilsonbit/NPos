import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useState } from 'react'

interface LoginPageProps {
  onLogin: () => void
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [keepLogged, setKeepLogged] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#e8edf2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: 380,
          borderRadius: 2,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/images/logo_qas.png"
          alt="Logo"
          sx={{ height: 52, objectFit: 'contain', mb: 1 }}
        />

        {/* Título */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: '#1976d2', fontSize: 22, letterSpacing: 0.3 }}
        >
          OmniPOS
        </Typography>

        {/* Subtítulo */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Insira suas credenciais para continuar
        </Typography>

        {/* Formulário */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth
            label="Email / Usuário"
            size="small"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            fullWidth
            label="Senha"
            size="small"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 18, color: '#9e9e9e' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 18, color: '#9e9e9e' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={keepLogged}
                  onChange={(e) => setKeepLogged(e.target.checked)}
                  sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  Manter logado
                </Typography>
              }
            />
            <Link
              href="#"
              underline="hover"
              sx={{ fontSize: 13, color: '#1976d2' }}
              onClick={(e) => e.preventDefault()}
            >
              Esqueceu a senha?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 0.5,
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 15,
              height: 42,
              borderRadius: 1,
            }}
          >
            Logar
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export { LoginPage }
