import { useState } from "react";
import {
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    if (!agreed) return;
    router.push("/(tabs)");
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50"
      edges={["top", "bottom"]}
      style={{ backgroundColor: "#DDD5CE" }}
    >
      {/* Header */}
      <ThemedView className="flex-row items-center px-4 py-2">
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <ThemedText
          type="defaultSemiBold"
          className="text-lg flex-1 text-center mr-10 text-slate-900"
        >
          Create Account
        </ThemedText>
      </ThemedView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card */}
        <View className="w-full rounded-xl mt-3 mb-6 items-center justify-center py-6">
          <Image
            source={require("@/assets/images/surveyopsplus-logo.webp")}
            style={{ width: "100%", height: 130 }}
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <ThemedText
          type="title"
          className="text-slate-900 text-3xl font-bold mb-1"
        >
          Welcome Aboard
        </ThemedText>
        <ThemedText className="text-slate-600 text-base mb-8">
          Sign up to start your first inspection.
        </ThemedText>

        {/* Full Name */}
        <View className="mb-5">
          <ThemedText
            type="defaultSemiBold"
            className="text-sm text-slate-900 mb-2 ml-1"
          >
            Full Name
          </ThemedText>
          <ThemedView className="flex-row items-center gap-3 h-12 px-4 rounded-xl border border-black-400">
            <MaterialIcons name="person" size={20} color="#6b6c6e" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="John Doe"
              placeholderTextColor="#6b6c6e"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </ThemedView>
        </View>

        {/* Email Address */}
        <View className="mb-5">
          <ThemedText
            type="defaultSemiBold"
            className="text-sm text-slate-900 mb-2 ml-1"
          >
            Email Address
          </ThemedText>
          <ThemedView className="flex-row items-center gap-3 h-12 px-4 rounded-xl border border-black-400">
            <MaterialIcons name="mail" size={20} color="#6b6c6e" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="john@shipping.com"
              placeholderTextColor="#6b6c6e"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>
        </View>

        {/* Password */}
        <View className="mb-6">
          <ThemedText
            type="defaultSemiBold"
            className="text-sm text-slate-900 mb-2 ml-1"
          >
            Password
          </ThemedText>
          <ThemedView className="flex-row items-center gap-3 h-12 px-4 rounded-xl border border-black-400">
            <MaterialIcons name="lock" size={20} color="#6b6c6e" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="••••••••"
              placeholderTextColor="#6b6c6e"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </ThemedView>
        </View>

        {/* Register button */}
        <TouchableOpacity
          className="items-center justify-center rounded-xl border-2 border-primary py-4 mb-8"
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={!agreed}
        >
          <ThemedText className="text-slate-900 text-base font-bold">
            Register
          </ThemedText>
        </TouchableOpacity>
        {/* 
        <TouchableOpacity
          className={`flex-row items-center justify-center gap-2 rounded-xl h-12 mb-8 ${agreed ? 'bg-primary' : 'bg-primary/50'}`}
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={!agreed}
        >
          <ThemedText className="text-white text-base font-bold">Register</ThemedText>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity> */}

        {/* Footer link */}
        <View className="flex-row items-center justify-center gap-1">
          <ThemedText className="text-sm text-slate-600">
            Already have an account?
          </ThemedText>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <ThemedText className="text-slate-900 text-sm font-bold">
                Log in
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
