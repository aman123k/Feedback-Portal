import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Group,
  Modal,
  NativeSelect,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { redirect, type MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import { FaAngleDown, FaPlus } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import {
  cookie,
  createFeedbackPost,
  deleteCookie,
  deleteFeedbackPost,
  feedbacks,
  getDirectusUser,
  getFeedbackPost,
  updateFeedbackPost,
} from "~/plugins/directus";
import { useEffect } from "react";
// import { handleTokenRefresh } from "~/utils/auth";
// import { getSession } from "~/session/session";

export const meta: MetaFunction = () => {
  return [
    { title: "Feedback Portal" },
    { name: "description", content: "Welcome to my feedback portal" },
  ];
};

export const loader = async ({ request }: { request: Request }) => {
  const getCookie = request.headers.get("Cookie");
  const userToken = await cookie.parse(getCookie);
  if (!userToken) return redirect("/login");
  const userInfo = await getDirectusUser(userToken);
  const feedbacks = await getFeedbackPost();
  return Response.json({ userInfo, feedbacks });
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  switch (intent) {
    case "logout": {
      return redirect("/", {
        headers: {
          "Set-Cookie": await deleteCookie.serialize(""),
        },
      });
    }
    case "create_feedback": {
      const title = formData.get("title") as string;
      const category = formData.get("category");
      const description = formData.get("description") as string;

      if (!title.trim() || !description.trim()) {
        return Response.json(
          { error: "Title and Description are required" },
          { status: 400 }
        );
      }
      const result = await createFeedbackPost({
        title,
        description,
        category: category as "Bug" | "Feature" | "Other",
      });
      if (!result) {
        return Response.json({ error: result }, { status: 400 });
      }

      return Response.json({ success: "Feedback created successfully!" });
    }
    case "update_feedback": {
      const id = formData.get("id") as string;
      const status = formData.get("status") as string;
      const result = await updateFeedbackPost(id, status);
      if (!result) {
        return Response.json({ error: result }, { status: 400 });
      }
      return Response.json({ success: "Status updated successfully!" });
    }
    case "delete_feedback": {
      const id = formData.get("id") as string;
      const result = await deleteFeedbackPost(id);
      if (!result) {
        return Response.json({ error: result }, { status: 400 });
      }
      return Response.json({ success: "Feedback delete successfully!" });
    }
    default:
      return Response.json({ error: "Invalid action" }, { status: 400 });
  }
};

type FetcherData = {
  success?: string;
  error?: string;
};

export default function Index() {
  const [opened, { open, close }] = useDisclosure(false);
  const { userInfo, feedbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();

  // Close modal when form submission is successful
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      close();
      // Revalidate the data after successful submission
      fetcher.load("/");
    }
  }, [fetcher.state, fetcher.data, close, fetcher]);

  if (!userInfo) {
    return null;
  }

  return (
    <Container size="xl" py="xl">
      <Flex justify={"space-between"} align={"center"}>
        <Flex direction={"column"} gap={"2px"}>
          <Title order={1}>
            {userInfo.role !== "00c1bbf8-af22-467e-80b7-a88b6115eed0"
              ? "Admin Dashboard"
              : "My Feedback"}
          </Title>
          <Text c="dimmed">
            Welcome back, {userInfo.first_name} {userInfo.last_name}
          </Text>
        </Flex>
        <Group>
          <Button leftIcon={<FaPlus size="16px" />} onClick={open}>
            Create Feedback
          </Button>

          <Form method="post">
            <TextInput type="hidden" name="intent" value="logout" />
            <Button
              variant="outline"
              leftIcon={<MdLogout size="1rem" />}
              type="submit"
            >
              Logout
            </Button>
          </Form>
        </Group>
      </Flex>

      {/* if there is not any card */}
      {feedbacks?.length <= 0 && (
        <Flex align={"center"} justify={"center"} mt={"15%"}>
          <Card shadow="sm" padding="lg" w={"550px"} radius="md" withBorder>
            <Flex justify={"center"} direction={"column"} align={"center"}>
              <Text size="xl" weight={700} ff={"sans-serif"}>
                No feedbacks found
              </Text>
              <Text color="dimmed" size="md" mt="xs">
                Be the first to share your thoughts or report a bug.
              </Text>
              <Button
                mt="md"
                size="md"
                variant="light"
                color="blue"
                onClick={open}
                leftIcon={<FaPlus size="16px" />}
              >
                Create Feedback
              </Button>
            </Flex>
          </Card>
        </Flex>
      )}

      {/* Feedback Card */}
      <Flex direction={"column"} gap={"sm"} mt={"40px"}>
        <Grid>
          {feedbacks &&
            feedbacks?.map((feedback: feedbacks, index: number) => {
              return (
                <Grid.Col span={4} key={index}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Badge
                      color={
                        feedback?.status === "draft"
                          ? "yellow"
                          : feedback?.status === "reject"
                          ? "red"
                          : "green"
                      }
                    >
                      {feedback?.status}
                    </Badge>
                    <Text fw={500} size="md" mt={"sm"}>
                      {feedback?.title}
                    </Text>

                    <Text c="dimmed" size="sm">
                      {feedback?.description}
                    </Text>
                    <Flex gap={"xs"} mt="xs" align={"center"}>
                      <Text fw={500}>Category of This Feedback : </Text>
                      <Badge
                        color={
                          feedback?.category === "Other"
                            ? "violet"
                            : feedback?.category === "Bug"
                            ? "red"
                            : "green"
                        }
                      >
                        {feedback?.category}{" "}
                      </Badge>
                    </Flex>
                    {userInfo.role !==
                      "00c1bbf8-af22-467e-80b7-a88b6115eed0" && (
                      <Flex gap={"xs"} mt="xs" align={"center"}>
                        <Text fw={500}>Written By : </Text>
                        <Badge>
                          {feedback?.created_by?.first_name}{" "}
                          {feedback?.created_by?.last_name}
                        </Badge>
                      </Flex>
                    )}
                    {userInfo.role !==
                      "00c1bbf8-af22-467e-80b7-a88b6115eed0" && (
                      <Grid grow>
                        <Grid.Col span={4}>
                          <Form method="post">
                            <TextInput
                              type="hidden"
                              name="intent"
                              value="update_feedback"
                            />
                            <TextInput
                              type="hidden"
                              name="id"
                              value={feedback?.id}
                            />

                            <NativeSelect
                              name="status"
                              mt="md"
                              radius="md"
                              rightSection={<FaAngleDown size={16} />}
                              defaultValue={feedback?.status}
                              data={[
                                { value: "published", label: "PUBLISHED" },
                                { value: "draft", label: "DRAFT" },
                                { value: "reject", label: "REJECT" },
                              ]}
                              onChange={(event) => {
                                const form = event.currentTarget.form;
                                if (form) form.submit();
                              }}
                            />
                          </Form>
                        </Grid.Col>
                        <Grid.Col span={4}>
                          <fetcher.Form method="post">
                            <TextInput
                              type="hidden"
                              name="id"
                              value={feedback?.id}
                            />
                            <TextInput
                              type="hidden"
                              name="intent"
                              value="delete_feedback"
                            />
                            <Button
                              type="submit"
                              color="red"
                              fullWidth
                              mt="md"
                              radius="md"
                              loading={fetcher.state === "submitting"}
                            >
                              DELETE
                            </Button>
                          </fetcher.Form>
                        </Grid.Col>
                      </Grid>
                    )}
                  </Card>
                </Grid.Col>
              );
            })}
        </Grid>
      </Flex>

      {/* Create feedback form */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create New Feedback"
        size="md"
        centered
        radius={"lg"}
      >
        <fetcher.Form method="post">
          <TextInput type="hidden" name="intent" value="create_feedback" />
          <TextInput
            label="Title"
            required
            size="sm"
            name="title"
            placeholder="Enter your title"
            w={"100%"}
            mb={"md"}
          />
          <NativeSelect
            data={["Bug", "Feature", "Other"]}
            w="100%"
            withAsterisk
            required
            name="category"
            label="Category"
            mb={"md"}
          />
          <Textarea
            label="Description"
            withAsterisk
            required
            w={"100%"}
            name="description"
            placeholder="Enter your description"
            mb={"md"}
          />

          {fetcher.data?.error && (
            <Alert color="red" w="100%" mb={"md"}>
              {fetcher.data.error}
            </Alert>
          )}

          <Button
            type="submit"
            w={"100%"}
            loading={fetcher.state === "submitting"}
          >
            Submit
          </Button>
        </fetcher.Form>
      </Modal>
    </Container>
  );
}
