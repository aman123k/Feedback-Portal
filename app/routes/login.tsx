import {
  Anchor,
  Box,
  Button,
  Flex,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Alert,
} from "@mantine/core";
import { Form, redirect, useActionData } from "@remix-run/react";
import { MdAlternateEmail } from "react-icons/md";
import { cookie, refreshCookie, userLogin } from "~/plugins/directus";
// import { commitSession, getSession } from "~/session/session";

interface ApiError {
  errors?: Array<{ message: string }>;
}

export const loader = async ({ request }: { request: Request }) => {
  const getCookie = request.headers.get("Cookie");
  const userToken = await cookie.parse(getCookie);
  if (userToken) return redirect("/");
  return Response.json({});
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email.trim() || !password) {
    return Response.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // const session = await getSession(request.headers.get("Cookie"));
    const result = await userLogin(email, password);

    if (result?.success) {
      return redirect("/", {
        headers: {
          "Set-Cookie": [
            await cookie.serialize(result?.user?.access_token),
            await refreshCookie.serialize(result?.user?.refresh_token),
          ].join(", "),
        },
      });
    }

    // if (!result.user.access_token) {
    //   return redirect("/", {
    //     headers: {
    //       "Set-Cookie": await commitSession(session),
    //     },
    //   });
    // }
    // result.user.access_token &&
    //   session.set("access_token", result.user.access_token);
    // result.user.refresh_token &&
    //   session.set("refresh_token", result.user.refresh_token);
    // result.user.expires && session.set("expires", String(result.user.expires));
    // result.user.expires_at &&
    //   session.set("expires_at", String(result.user.expires_at));

    // return redirect("/", {
    //   headers: {
    //     "Set-Cookie": await commitSession(session),
    //   },
    // });

    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (err) {
    const apiError = err as ApiError;
    return Response.json(
      {
        error: apiError.errors?.[0]?.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
};

function Login() {
  const actionData = useActionData<typeof action>();
  const icon = <MdAlternateEmail size={16} />;
  return (
    <Box bg={"blue"} h="100vh">
      <Flex align={"center"} justify={"center"} h="100vh">
        <Paper bg={"white"} w="450px" p={"xl"} radius={"10px"}>
          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"lg"}
          >
            <Title order={1}>Login</Title>
            <Box w={"100%"}>
              <Form method="post">
                <TextInput
                  label="Email"
                  required
                  size="sm"
                  icon={icon}
                  name="email"
                  placeholder="Enter your Email"
                  w={"100%"}
                  mb={"xs"}
                />
                <PasswordInput
                  label="Password"
                  withAsterisk
                  name="password"
                  required
                  placeholder="Enter your Password"
                  w={"100%"}
                  mb={"xs"}
                />
                <Button type="submit" w={"100%"}>
                  Login
                </Button>
              </Form>
            </Box>
          </Flex>
          {actionData?.error && (
            <Alert color="red" w="100%">
              {actionData.error}
            </Alert>
          )}
          <Flex mt={"5px"} align={"center"} w={"100%"} justify={"end"}>
            <Text>
              Don&apos;t have an account?{" "}
              <Anchor href="/register">Register here</Anchor>
            </Text>
          </Flex>
        </Paper>
      </Flex>
    </Box>
  );
}

export default Login;
