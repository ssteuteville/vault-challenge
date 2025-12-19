import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { LegendList } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

type ItemStatus = "all" | "available" | "borrowed" | "unavailable";

type Item = RouterOutputs["item"]["all"][number];

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181B",
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: "#71717A",
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7C3AED",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#18181B",
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181B",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#18181B",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalSection: {
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18181B",
    marginBottom: 12,
  },
  modalFilterOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  modalFilterOptionActive: {
    backgroundColor: "#F3E8FF",
    borderColor: "#9333EA",
  },
  modalFilterOptionInactive: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
  },
  modalFilterOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalFilterOptionTextActive: {
    color: "#9333EA",
  },
  modalFilterOptionTextInactive: {
    color: "#18181B",
  },
  userSearchContainer: {
    marginBottom: 16,
  },
  userSearchInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#18181B",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    marginBottom: 12,
  },
  userListItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E4E4E7",
    backgroundColor: "#FAFAFA",
  },
  userListItemSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#9333EA",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181B",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#71717A",
  },
  clearUserButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
  },
  clearUserButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalDoneButton: {
    backgroundColor: "#9333EA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#18181B",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#71717A",
    fontWeight: "500",
  },
});

function EmptyState() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 56, fontWeight: "900", color: "#9333EA", marginBottom: 24, letterSpacing: -1 }}>
        VAULT
      </Text>
      <View style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
        <Text style={{ fontSize: 48 }}>🔐</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#18181B", marginBottom: 8 }}>
        Welcome to Vault
      </Text>
      <Text style={{ fontSize: 16, color: "#71717A", textAlign: "center", marginBottom: 32, lineHeight: 24 }}>
        Sign in to browse and borrow items from your community
      </Text>
      <Pressable
        onPress={() =>
          authClient.signIn.social({
            provider: "discord",
            callbackURL: "/",
          })
        }
        style={{
          backgroundColor: "#9333EA",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          paddingVertical: 16,
          shadowColor: "#9333EA",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
          Sign in with Discord
        </Text>
      </Pressable>
    </View>
  );
}

function FilterModal({
  visible,
  onClose,
  statusFilter,
  onStatusChange,
  selectedUserId,
  onUserChange,
}: {
  visible: boolean;
  onClose: () => void;
  statusFilter: ItemStatus;
  onStatusChange: (status: ItemStatus) => void;
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
}) {
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery(
    trpc.auth.searchUsers.queryOptions({ query: userSearchQuery }),
  );

  const { data: selectedUser } = useQuery({
    ...trpc.auth.getUserById.queryOptions({ id: selectedUserId ?? "" }),
    enabled: !!selectedUserId,
  });

  const filters: { label: string; value: ItemStatus }[] = [
    { label: "All", value: "all" },
    { label: "Available", value: "available" },
    { label: "Borrowed", value: "borrowed" },
    { label: "Unavailable", value: "unavailable" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters</Text>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Status</Text>
            {filters.map((filter) => {
              const isActive = statusFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => onStatusChange(filter.value)}
                  style={[
                    styles.modalFilterOption,
                    isActive
                      ? styles.modalFilterOptionActive
                      : styles.modalFilterOptionInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalFilterOptionText,
                      isActive
                        ? styles.modalFilterOptionTextActive
                        : styles.modalFilterOptionTextInactive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Filter by Owner</Text>
            <View style={styles.userSearchContainer}>
              <TextInput
                style={styles.userSearchInput}
                placeholder="Search users..."
                placeholderTextColor="#A1A1AA"
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
              />
              {selectedUser && (
                <Pressable
                  style={styles.clearUserButton}
                  onPress={() => onUserChange(null)}
                >
                  <Text style={styles.clearUserButtonText}>
                    Clear: {selectedUser.name || selectedUser.email || "Unknown"}
                  </Text>
                </Pressable>
              )}
              {usersLoading ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#9333EA" />
                </View>
              ) : users.length === 0 ? (
                <View style={{ paddingVertical: 20 }}>
                  <Text style={{ textAlign: "center", color: "#71717A", fontSize: 14 }}>
                    {userSearchQuery.length > 0 ? "No users found" : "Start typing to search users"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={users}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedUserId === item.id;
                    return (
                      <Pressable
                        style={[
                          styles.userListItem,
                          isSelected && styles.userListItemSelected,
                        ]}
                        onPress={() => onUserChange(isSelected ? null : item.id)}
                      >
                        <Text style={styles.userName}>
                          {item.name || "Unknown"}
                        </Text>
                        {item.email && (
                          <Text style={styles.userEmail}>{item.email}</Text>
                        )}
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable style={styles.modalDoneButton} onPress={onClose}>
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ItemCard({ item }: { item: Item }) {
  const status = (item as { effectiveStatus?: string }).effectiveStatus ?? item.status;
  const categories = item.category
    ? item.category.split(", ").filter(Boolean)
    : [];

  const statusConfig = {
    available: {
      bg: "#10B981",
      label: "Available",
    },
    borrowed: {
      bg: "#F59E0B",
      label: "Borrowed",
    },
    unavailable: {
      bg: "#6B7280",
      label: "Unavailable",
    },
  };

  const statusStyle = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.unavailable;

  return (
    <Link
      asChild
      href={{
        pathname: "/items/[id]",
        params: { id: item.id },
      }}
    >
      <Pressable style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <View style={styles.imageContainer}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 40, opacity: 0.3 }}>📦</Text>
              )}
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {categories.slice(0, 3).map((category) => (
              <View key={category} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
            {categories.length > 3 && (
              <View style={[styles.categoryTag, { backgroundColor: "#F4F4F5" }]}>
                <Text style={[styles.categoryText, { color: "#71717A" }]}>
                  +{categories.length - 3}
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={styles.statusText}>{statusStyle.label}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function ItemList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { data: items = [], isLoading } = useQuery(
    trpc.item.all.queryOptions(),
  );

  const { data: selectedUser } = useQuery({
    ...trpc.auth.getUserById.queryOptions({ id: selectedUserId ?? "" }),
    enabled: !!selectedUserId,
  });

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descriptionMatch = item.description.toLowerCase().includes(query);
        const categoryMatch = item.category
          ? item.category.toLowerCase().includes(query)
          : false;
        return titleMatch || descriptionMatch || categoryMatch;
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const effectiveStatus =
          (item as { effectiveStatus?: string }).effectiveStatus ?? item.status;
        return effectiveStatus === statusFilter;
      });
    }

    if (selectedUserId) {
      filtered = filtered.filter((item) => item.owner?.id === selectedUserId);
    }

    return filtered;
  }, [items, searchQuery, statusFilter, selectedUserId]);

  const getFilterLabel = () => {
    const labels: Record<ItemStatus, string> = {
      all: "All",
      available: "Available",
      borrowed: "Borrowed",
      unavailable: "Unavailable",
    };
    return labels[statusFilter];
  };

  const getFilterBadges = () => {
    const badges: string[] = [];
    if (statusFilter !== "all") {
      badges.push(getFilterLabel());
    }
    if (selectedUser) {
      badges.push(selectedUser.name || selectedUser.email || "User");
    }
    return badges;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <Text style={{ fontSize: 20 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#A1A1AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Pressable
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
          <Text style={styles.filterButtonText}>Filters</Text>
          {getFilterBadges().length > 0 && (
            <View style={{ flexDirection: "row", marginLeft: 8, gap: 4 }}>
              {getFilterBadges().map((badge, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#9333EA",
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={{ fontSize: 18, color: "#71717A" }}>›</Text>
      </Pressable>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
        }}
        selectedUserId={selectedUserId}
        onUserChange={(userId) => {
          setSelectedUserId(userId);
        }}
      />

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={{ fontSize: 32, opacity: 0.5 }}>🔍</Text>
          </View>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "Try adjusting your search or filters"
              : `No ${statusFilter === "all" ? "" : statusFilter} items available`}
          </Text>
        </View>
      ) : (
        <LegendList
          data={filteredItems}
          estimatedItemSize={180}
          keyExtractor={(item) => item.id}
          renderItem={(p) => <ItemCard item={p.item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

export default function BrowseScreen() {
  const { data: session } = authClient.useSession();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }} edges={["top"]}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
        {session?.user ? <ItemList /> : <EmptyState />}
      </View>
    </SafeAreaView>
  );
}

