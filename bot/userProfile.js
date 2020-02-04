// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

class UserProfile {
    constructor(name,gender,email,phoneNumber,subTopicId,questions,levelId) {
        this.gender = gender;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.subTopicId=subTopicId;
        this.levelId=levelId
        this.questions=questions

    }
}

module.exports.UserProfile = UserProfile;
