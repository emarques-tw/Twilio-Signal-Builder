import { useState, FormEvent } from "react";
import { Box } from "@twilio-paste/core/box";
import { Button } from "@twilio-paste/core/button";
import { Form, FormControl } from "@twilio-paste/core/form";
import { Input } from "@twilio-paste/core/input";
import { Heading } from "@twilio-paste/core/heading";
import { Stack } from "@twilio-paste/core/stack";
import { Alert } from "@twilio-paste/core/alert";
import { Label } from "@twilio-paste/core/label";
import { LogoTwilioIcon } from "@twilio-paste/icons/esm/LogoTwilioIcon";
import { setSecret, verifySecret } from "./api";

type Props = { onAuthenticated: () => void };

export function LoginGate({ onAuthenticated }: Props) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const ok = await verifySecret(password);
      if (!ok) {
        setError("Contraseña incorrecta");
        return;
      }
      setSecret(password);
      onAuthenticated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      backgroundColor="colorBackgroundBody"
    >
      <Box
        width="400px"
        padding="space60"
        backgroundColor="colorBackground"
        borderRadius="borderRadius30"
        boxShadow="shadowCard"
      >
        <Stack orientation="vertical" spacing="space60">
          <Heading as="h3" variant="heading20">
            <Stack orientation="horizontal" spacing="space30">
              <LogoTwilioIcon color="colorTextIcon" decorative size="sizeIcon60" />
              <span>Builder MX &mdash; SIGNAL México</span>
            </Stack>
          </Heading>
          {error && <Alert variant="error">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Stack orientation="vertical" spacing="space50">
              <FormControl>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </FormControl>
              <span>&nbsp;</span>
              <Button variant="primary" type="submit" loading={isLoading} fullWidth>
                Ingresar
              </Button>
            </Stack>
          </Form>
        </Stack>
      </Box>
    </Box>
  );
}
