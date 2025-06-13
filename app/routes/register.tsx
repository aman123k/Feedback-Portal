import {
  Alert,
  Anchor,
  Box,
  Button,
  Flex,
  NativeSelect,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Form, redirect, useActionData } from "@remix-run/react";
import { MdAlternateEmail } from "react-icons/md";
import { cookie, registerUser } from "~/plugins/directus";

export type ActionData = {
  error?: string;
  success?: boolean;
};

interface ApiError {
  errors?: Array<{ message: string }>;
}

export const loader = async ({ request }: { request: Request }) => {
  try {
    const getCookie = request.headers.get("Cookie");
    const userToken = await cookie.parse(getCookie);
    if (userToken) return redirect("/");
    return Response.json({});
  } catch (error) {
    console.error("Error loading roles:", error);
    return Response.json({ roles: [] });
  }
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !first_name || !last_name) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    await registerUser({
      email,
      password,
      first_name,
      last_name,
      role,
    });

    return redirect("/login");
  } catch (err) {
    const apiError = err as ApiError;
    console.log(err, "error while register a user");
    return Response.json(
      { error: apiError.errors?.[0]?.message || "Registration failed" },
      { status: 500 }
    );
  }
};

function Register() {
  const actionData = useActionData<typeof action>();
  const icon = <MdAlternateEmail size={16} />;
  const roleOption = [
    {
      label: "Public",
      value: "00c1bbf8-af22-467e-80b7-a88b6115eed0",
    },
    {
      label: "Administrator",
      value: "832bf194-f28d-4b13-9602-2716d1d4869a",
    },
  ];
  return (
    <Box bg={"blue"} h="100vh" mih={"100vh"}>
      <Flex align={"center"} justify={"center"} h="100vh">
        <Paper bg={"white"} w="450px" p={"xl"} radius={"10px"}>
          <Flex
            direction={"column"}
            justify={"center"}
            align={"center"}
            gap={"lg"}
          >
            <Title order={1}>Register</Title>
            <Box w={"100%"}>
              <Form method="post">
                <Flex
                  align={"center"}
                  justify={"space-between"}
                  w={"100%"}
                  mb={"xs"}
                >
                  <TextInput
                    label="First Name"
                    withAsterisk
                    required
                    name="first_name"
                    size="sm"
                    w={"49%"}
                    placeholder="Enter your FistName"
                  />
                  <TextInput
                    label="Last Name"
                    withAsterisk
                    required
                    name="last_name"
                    w={"49%"}
                    placeholder="Enter your LastName"
                  />
                </Flex>
                <NativeSelect
                  data={roleOption}
                  w="100%"
                  withAsterisk
                  required
                  name="role"
                  label="Select Role"
                  mb={"xs"}
                />
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
                  required
                  name="password"
                  placeholder="Enter your Password"
                  w={"100%"}
                  mb={"xs"}
                />

                <Button type="submit" w={"100%"}>
                  Register
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
              Already have an account <Anchor href="/login">Login here</Anchor>
            </Text>
          </Flex>
        </Paper>
      </Flex>
    </Box>
  );
}

export default Register;
